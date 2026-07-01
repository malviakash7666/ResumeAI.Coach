import { createRequire } from "module";
import db from "../database/models/index.js";
import cloudinaryService from "../services/cloudinary.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const User = db.User;

// In-memory session store
const sessions = {};

// Helper: Generate clean session IDs
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

// Helper: Call Groq API (LLaMA 3)
async function callGroqAPI(messages, responseFormat = "json_object") {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_groq_api_key_here") {
    throw new Error("Groq API Key is not configured in the backend environment variables.");
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.3,
        response_format: responseFormat === "json_object" ? { type: "json_object" } : undefined,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ Groq API error response: ${errText}`);
      throw new Error(`Groq API returned status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from Groq API");
    }

    return content;
  } catch (error) {
    console.error("❌ Groq API Call failed:", error);
    throw error;
  }
}


/* ==========================================
   ROUTE CONTROLLER EXPORTS
========================================== */

// 1. Upload Resume PDF
export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded. Please upload a PDF resume.");
    }

    let resumeText = "";
    try {
      if (typeof pdfParse === "function") {
        const pdfData = await pdfParse(req.file.buffer);
        resumeText = pdfData.text;
      } else if (pdfParse && typeof pdfParse.PDFParse === "function") {
        const parser = new pdfParse.PDFParse({ data: req.file.buffer });
        const pdfData = await parser.getText();
        resumeText = pdfData.text;
      } else {
        throw new Error("No compatible pdf-parse export found.");
      }
    } catch (parseError) {
      console.error("❌ PDF Parse error:", parseError);
      throw new ApiError(400, `Failed to parse PDF resume: ${parseError.message}`);
    }

    if (!resumeText || resumeText.trim().length === 0) {
      throw new ApiError(400, "Extracted resume text is empty. Please upload a text-based PDF.");
    }

    let sessionId;

    // Dual path: Authenticated User vs. Guest
    if (req.user && req.user.id) {
      const user = await User.findByPk(req.user.id);
      if (!user) {
        throw new ApiError(404, "User profile not found.");
      }

      // Upload to Cloudinary
      const uploadResult = await cloudinaryService.uploadResume(
        req.file.buffer,
        req.file.originalname
      );

      // Create a Resume row in the DB
      const resumeRecord = await db.Resume.create({
        userId: user.id,
        fileName: req.file.originalname,
        resumeUrl: uploadResult.secure_url,
        resumeAnalysis: null,
      });

      sessionId = resumeRecord.id; // use Resume UUID as the session identifier
      console.log(`📂 Auth User Resume uploaded. Resume ID: ${sessionId}, URL: ${uploadResult.secure_url}`);
    } else {
      sessionId = generateSessionId();
      console.log(`📂 Guest Resume uploaded. Created session: ${sessionId}`);
    }

    // Cache the parsed text in-memory for immediate downstream analysis / mock interviews
    sessions[sessionId] = {
      resumeText,
      createdAt: new Date(),
      analysis: null,
      interview: null,
      finalReport: null,
      fileName: req.file.originalname,
    };

    return res.status(200).json(new ApiResponse(200, { sessionId }, "Resume uploaded successfully"));
  } catch (err) {
    next(err);
  }
};

// 2. Analyze Resume
export const analyzeResume = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId || !sessions[sessionId]) {
      throw new ApiError(404, "Active session not found. Please upload your resume first.");
    }

    const { resumeText } = sessions[sessionId];

    let analysisResult;
    try {
      const messages = [
        {
          role: "system",
          content: "You are a senior recruiter. Analyze resume and return structured JSON only.",
        },
        {
          role: "user",
          content: `Analyze the following resume text. Extract details and return a JSON object with:
          {
            "skills": ["Skill1", "Skill2", ...],
            "experienceLevel": "Entry Level / Mid Level / Senior Level / Lead",
            "weakAreas": ["Area1", "Area2", ...],
            "suggestedRoles": ["Role1", "Role2", ...],
            "difficulty": "Beginner / Intermediate / Advanced"
          }

          Resume text:
          ${resumeText}
          
          Respond ONLY with the JSON object, no introductory or concluding text.`,
        },
      ];

      const groqResponse = await callGroqAPI(messages, "json_object");
      analysisResult = JSON.parse(groqResponse);
    } catch (apiError) {
      throw new ApiError(500, `AI Analysis failed: ${apiError.message}`);
    }

    sessions[sessionId].analysis = analysisResult;

    // Save to database if authenticated user
    if (req.user && req.user.id) {
      const resumeRecord = await db.Resume.findByPk(sessionId);
      if (resumeRecord) {
        await resumeRecord.update({ resumeAnalysis: analysisResult });
        console.log(`💾 Saved resume analysis to DB for resume ID: ${sessionId}`);
      }
    }

    return res.status(200).json(new ApiResponse(200, analysisResult, "Resume analyzed successfully"));
  } catch (err) {
    next(err);
  }
};

// 3. Start Interview
export const startInterview = async (req, res, next) => {
  try {
    const { sessionId, mode } = req.body;
    if (!sessionId || !sessions[sessionId]) {
      throw new ApiError(404, "Active session not found. Please upload your resume first.");
    }

    const { analysis } = sessions[sessionId];
    if (!analysis) {
      throw new ApiError(400, "Please run resume analysis first before starting the mock interview.");
    }

    // Initialize interview session state
    sessions[sessionId].interview = {
      chatHistory: [],
      scores: [],
      currentQuestion: "",
      questionCount: 0,
    };

    let firstQuestion;
    try {
      const messages = [
        {
          role: "system",
          content: "You are a friendly but rigorous technical interviewer. Ask exactly one question at a time. Adapt difficulty dynamically based on answers. Speak naturally and warmly like a human recruiter, using greetings and conversational transitions. Banned terms: Never prefix your question with labels like 'Question 1', 'Next Question:', or similar robotics headers.",
        },
        {
          role: "user",
          content: `The candidate has the following resume profile details:
          Skills: ${analysis.skills.join(", ")}
          Suggested Roles: ${analysis.suggestedRoles.join(", ")}
          Experience Level: ${analysis.experienceLevel}
          Target Interview Difficulty: ${analysis.difficulty}

          Start the interview by greeting the candidate (e.g. 'Hi candidate, thanks for joining, let's begin by discussing...') and ask the FIRST technical interview question. Make it engaging and tailored to their profile.
          Respond ONLY with a JSON object in this format:
          {
            "question": "Your natural human greeting and first interview question here"
          }
          `,
        },
      ];

      const groqResponse = await callGroqAPI(messages, "json_object");
      const parsed = JSON.parse(groqResponse);
      firstQuestion = parsed.question;
    } catch (apiError) {
      throw new ApiError(500, `Failed to generate interview question: ${apiError.message}`);
    }

    sessions[sessionId].interview.currentQuestion = firstQuestion;
    sessions[sessionId].interview.chatHistory.push({ role: "assistant", content: firstQuestion });
    sessions[sessionId].interview.questionCount = 1;

    // Save initial interview state to database if user is logged in
    if (req.user && req.user.id) {
      const interviewRecord = await db.Interview.create({
        userId: req.user.id,
        resumeId: sessionId,
        fileName: sessions[sessionId].fileName || "resume.pdf",
        mode: mode || "text",
        chatHistory: sessions[sessionId].interview.chatHistory,
        scores: [],
        finalReport: null,
        overallScore: null,
      });
      sessions[sessionId].interview.dbInterviewId = interviewRecord.id;
      console.log(`💾 Saved initial interview history to DB with Interview ID: ${interviewRecord.id}`);
    }

    return res.status(200).json(new ApiResponse(200, { question: firstQuestion }, "Interview started successfully"));
  } catch (err) {
    next(err);
  }
};

// 4. Chat Interview (Submit Answer & Get Next Question)
export const chatInterview = async (req, res, next) => {
  try {
    const { sessionId, answer } = req.body;
    if (!sessionId || !sessions[sessionId]) {
      throw new ApiError(404, "Active session not found.");
    }

    const { interview, analysis } = sessions[sessionId];
    if (!interview) {
      throw new ApiError(400, "Interview state not initialized. Please call start-interview first.");
    }

    if (!answer || answer.trim().length === 0) {
      throw new ApiError(400, "Answer cannot be empty.");
    }

    const currentQuestion = interview.currentQuestion;

    // 1. Grade the current answer
    let grading;
    try {
      const messages = [
        {
          role: "system",
          content: "You are an expert technical evaluator. Rate candidate answers and return scores and feedback in JSON format.",
        },
        {
          role: "user",
          content: `Review the candidate's answer to the technical interview question.
          
          Question: "${currentQuestion}"
          Candidate's Answer: "${answer}"
 
          Rate their response on a 0 to 10 scale across four parameters:
          1. technicalScore (technical accuracy, depth)
          2. communicationScore (clarity, structured articulation)
          3. confidenceScore (assurance, delivery)
          4. problemSolvingScore (analytical breakdown, edge-case coverage)
          
          Calculate 'score' as the average of the four metrics.
          Respond ONLY with a JSON object in this format:
          {
            "feedback": "Short constructive feedback text (1-2 sentences)",
            "score": 8,
            "technicalScore": 8,
            "communicationScore": 9,
            "confidenceScore": 8,
            "problemSolvingScore": 7
          }
          `,
        },
      ];

      const groqResponse = await callGroqAPI(messages, "json_object");
      grading = JSON.parse(groqResponse);
    } catch (apiError) {
      throw new ApiError(500, `Failed to grade answer: ${apiError.message}`);
    }

    // Save history and scores
    interview.scores.push(grading);
    interview.chatHistory.push({ role: "user", content: answer });

    // 2. Generate the next question
    let nextQuestion;
    try {
      const chatHistoryFormatted = interview.chatHistory.map(c => `${c.role === "assistant" ? "Interviewer" : "Candidate"}: ${c.content}`).join("\n");
      const messages = [
        {
          role: "system",
          content: "You are a warm, professional, human-like technical interviewer. Banned prefixes: Never say robotic prefix headers like 'Question X', 'Next Question:', 'Answer:', or 'Score:'. Transition naturally like a human by acknowledging their answer (e.g. 'That's a nice explanation', 'Interesting perspective', 'Good point') and then moving to the next topic.",
        },
        {
          role: "user",
          content: `Review the ongoing technical interview conversation history:
          
          ${chatHistoryFormatted}
 
          The candidate's last answer was evaluated. (Score: ${grading.score}/10, Feedback: ${grading.feedback})
          
          Generate the next logical interview question. Follow up on their previous answer, projects, or weak areas. Gradually increase the difficulty.
          Respond ONLY with a JSON object in this format:
          {
            "nextQuestion": "Acknowledge their response naturally, and state your next question here"
          }
          `,
        },
      ];

      const groqResponse = await callGroqAPI(messages, "json_object");
      const parsed = JSON.parse(groqResponse);
      nextQuestion = parsed.nextQuestion;
    } catch (apiError) {
      throw new ApiError(500, `Failed to generate next question: ${apiError.message}`);
    }

    // Update state
    interview.currentQuestion = nextQuestion;
    interview.chatHistory.push({ role: "assistant", content: nextQuestion });
    interview.questionCount += 1;

    // Save ongoing interview state to database if user is logged in
    if (req.user && req.user.id && interview.dbInterviewId) {
      await db.Interview.update(
        {
          chatHistory: interview.chatHistory,
          scores: interview.scores,
        },
        { where: { id: interview.dbInterviewId } }
      );
      console.log(`💾 Saved ongoing interview history to DB for Interview ID: ${interview.dbInterviewId}`);
    }

    return res.status(200).json(
      new ApiResponse(200, {
        feedback: grading.feedback,
        score: grading.score,
        technicalScore: grading.technicalScore,
        communicationScore: grading.communicationScore,
        confidenceScore: grading.confidenceScore,
        problemSolvingScore: grading.problemSolvingScore,
        nextQuestion: nextQuestion,
      }, "Answer submitted successfully")
    );
  } catch (err) {
    next(err);
  }
};

// 5. End Interview & Generate Final Report
export const endInterview = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId || !sessions[sessionId]) {
      throw new ApiError(404, "Active session not found.");
    }

    const { interview, analysis } = sessions[sessionId];
    if (!interview || !analysis) {
      throw new ApiError(400, "No interview active or resume analyzed for this session.");
    }

    if (interview.scores.length === 0) {
      throw new ApiError(400, "No questions have been answered yet.");
    }

    let finalReport;
    try {
      const chatHistoryFormatted = interview.chatHistory.map(c => `${c.role === "assistant" ? "Interviewer" : "Candidate"}: ${c.content}`).join("\n");
      const scoresFormatted = JSON.stringify(interview.scores);

      const messages = [
        {
          role: "system",
          content: "You are a senior technical evaluator. Review the interview history and scores, and generate a comprehensive final evaluation report in JSON format.",
        },
        {
          role: "user",
          content: `Generate a final interview evaluation report.
          Candidate Resume Skills: ${analysis.skills.join(", ")}
          
          Interview Chat History:
          ${chatHistoryFormatted}
          
          Individual Answer Evaluations:
          ${scoresFormatted}
 
          Perform a detailed assessment of their technical strengths, weaknesses, communication quality, and confidence.
          You must also compile a list of ideal answers for the questions asked in this interview.
          Respond ONLY with a JSON object in this format:
          {
            "overallScore": 8.5,
            "technicalScore": 8.0,
            "communicationScore": 9.0,
            "confidenceScore": 8.5,
            "weakTopics": ["Topic 1", "Topic 2", ...],
            "strengths": ["Detailed Strength 1", "Detailed Strength 2", ...],
            "weaknesses": ["Detailed Weakness 1", "Detailed Weakness 2", ...],
            "recommendedTopics": ["Topic 1", "Topic 2", ...],
            "idealAnswers": [
              {
                "question": "Question text asked by AI",
                "idealAnswer": "Detailed ideal answer that the candidate should have given"
              }
            ],
            "studyRoadmap": [
              {
                "topic": "Topic Name",
                "actionableSteps": ["Step 1", "Step 2"],
                "estimatedTime": "1 week"
               }
            ]
          }
          `,
        },
      ];

      const groqResponse = await callGroqAPI(messages, "json_object");
      finalReport = JSON.parse(groqResponse);
    } catch (apiError) {
      throw new ApiError(500, `Failed to generate final report: ${apiError.message}`);
    }

    sessions[sessionId].finalReport = finalReport;

    // Save final report history to database if user is logged in
    if (req.user && req.user.id && interview.dbInterviewId) {
      await db.Interview.update(
        {
          chatHistory: interview.chatHistory,
          scores: interview.scores,
          finalReport: finalReport,
          overallScore: finalReport.overallScore || 0,
        },
        { where: { id: interview.dbInterviewId } }
      );
      console.log(`💾 Saved final interview evaluation to DB for Interview ID: ${interview.dbInterviewId}`);
    }

    return res.status(200).json(new ApiResponse(200, finalReport, "Interview ended successfully"));
  } catch (err) {
    next(err);
  }
};

// 6. Get User Resumes List
export const getUserResumes = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Authentication required.");
    }
    const list = await db.Resume.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(new ApiResponse(200, list, "Resumes list retrieved successfully"));
  } catch (err) {
    next(err);
  }
};

// 7. Get User Interviews List
export const getUserInterviews = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Authentication required.");
    }
    const list = await db.Interview.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(new ApiResponse(200, list, "Interviews list retrieved successfully"));
  } catch (err) {
    next(err);
  }
};

// 8. Get Specific Interview Report
export const getInterviewReport = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Authentication required.");
    }
    const { id } = req.params;
    const reportData = await db.Interview.findOne({
      where: { id, userId: req.user.id },
    });
    if (!reportData) {
      throw new ApiError(404, "Interview report not found.");
    }
    return res.status(200).json(new ApiResponse(200, reportData, "Interview report retrieved successfully"));
  } catch (err) {
    next(err);
  }
};

// 9. Delete Resume
export const deleteUserResume = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Authentication required.");
    }
    const { id } = req.params;
    const resume = await db.Resume.findOne({
      where: { id, userId: req.user.id },
    });
    if (!resume) {
      throw new ApiError(404, "Resume not found.");
    }

    const publicId = cloudinaryService.getPublicIdFromUrl(resume.resumeUrl);
    if (publicId) {
      try {
        await cloudinaryService.deleteResume(publicId);
      } catch (e) {
        console.warn("⚠️ Non-blocking warning: Failed to delete Cloudinary asset:", e.message);
      }
    }

    await resume.destroy();
    return res.status(200).json(new ApiResponse(200, {}, "Resume deleted successfully"));
  } catch (err) {
    next(err);
  }
};
