enum AnimationType {
    SweepForward, SweepBackward, Fade, FadeVertex, Wait
  }
  

interface StepEntry {
    time: number;
    index1: number;
    index2?: number;
    color1: string;
    color2?: string;
    animationType: AnimationType;
    
  }
  interface Step {
    frames: StepEntry[];
  }

  class StepMaker {
    
  }
  export { AnimationType }
  export type { StepEntry, Step}