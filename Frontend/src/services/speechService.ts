// Speech Service: Client-side wrappers for Browser Web Speech APIs (TTS and STT)

// ── Text To Speech (Speech Synthesis) ──
class TextToSpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
    }
  }

  speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (!this.synth) {
      if (onError) onError("Speech Synthesis not supported in this browser.");
      return;
    }

    this.stop(); // Stop any ongoing speech

    // Clean up text for speech synthesis (remove code segments or special symbols)
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "[Code segment omitted in speech]")
      .replace(/`([^`]+)`/g, "$1")
      .trim();

    this.currentUtterance = new SpeechSynthesisUtterance(cleanText);

    // Try to find a high-quality human-sounding English voice
    const voices = this.synth.getVoices();
    const selectVoice = () => {
      // Prioritize natural sounding voices
      const targetVoices = [
        "Google US English",
        "Microsoft David",
        "Microsoft Zira",
        "Samantha",
        "Daniel",
      ];
      for (const name of targetVoices) {
        const found = voices.find((v) => v.name.includes(name) && v.lang.startsWith("en"));
        if (found) return found;
      }
      // Fallback: any English voice
      const englishVoice = voices.find((v) => v.lang.startsWith("en"));
      return englishVoice || null;
    };

    const voice = selectVoice();
    if (voice) {
      this.currentUtterance.voice = voice;
    }

    // Set voice properties
    this.currentUtterance.rate = 1.0;  // Standard speed
    this.currentUtterance.pitch = 1.0; // Standard pitch
    this.currentUtterance.volume = 1.0;

    if (onStart) this.currentUtterance.onstart = onStart;
    if (onEnd) this.currentUtterance.onend = onEnd;
    if (onError) {
      this.currentUtterance.onerror = (e) => {
        // Ignore synthesis cancellations
        if (e.error !== "interrupted" && e.error !== "canceled") {
          onError(e);
        }
      };
    }

    this.synth.speak(this.currentUtterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }
}

// ── Speech To Text (Speech Recognition) ──
class SpeechToTextService {
  private recognition: any = null;
  private isListeningActive = false;

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;     // Keep listening until stopped
        this.recognition.interimResults = true;  // Provide partial transcript updates
        this.recognition.lang = "en-US";
      }
    }
  }

  startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (!this.recognition) {
      if (onError) onError("Web Speech Recognition not supported in this browser.");
      return;
    }

    if (this.isListeningActive) {
      return;
    }

    this.isListeningActive = true;
    let finalTranscript = "";

    this.recognition.onstart = () => {
      console.log("🎙️ Speech Recognition started...");
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
          onResult(finalTranscript.trim(), true);
        } else {
          interimTranscript += result[0].transcript;
          onResult((finalTranscript + interimTranscript).trim(), false);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error("🎙️ Speech recognition error:", event.error);
      if (onError) onError(event.error);
      this.isListeningActive = false;
    };

    this.recognition.onend = () => {
      console.log("🎙️ Speech Recognition ended.");
      this.isListeningActive = false;
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.error(e);
      this.isListeningActive = false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListeningActive) {
      this.recognition.stop();
      this.isListeningActive = false;
    }
  }

  isListening() {
    return this.isListeningActive;
  }
}

export const ttsService = new TextToSpeechService();
export const sttService = new SpeechToTextService();
