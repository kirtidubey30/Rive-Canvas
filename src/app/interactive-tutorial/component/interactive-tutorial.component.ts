import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Rive,Alignment, Fit, Layout, } from '@rive-app/canvas';
import { interactiveTutorialService } from './interactive-tutorial.service';

@Component({
  selector: 'app-interactive-tutorial',
  templateUrl: './interactive-tutorial.component.html',
  styleUrls: ['./interactive-tutorial.component.scss'],
})
export class InteractiveTutorialComponent implements AfterViewInit, OnDestroy {
  @ViewChild('riveCanvas', { static: false })
  riveCanvas: ElementRef<HTMLCanvasElement>;
  showLanguageSelection: boolean = true;
  showInteractiveVideo: boolean = false;
  isHand1Winner: boolean = false;
  isHand2Winner: boolean = false;
  isVideoPaused: boolean = false;
  audioStatus: string = 'Sound';
  showInteractiveContainer: boolean = true;
  is1stTimeUser = {
    hand1: false,
    hand2: false,
  };

  private rive: Rive;
  private currentAudio: HTMLAudioElement;
  private videoSource: string;
  private currentArtBoard: string;
  private playPauseTrigger;
  private soundTrigger;
  // private backTriggerFrom = interactiveTutorialConstant.backTriggerFrom;
  // private triggers = interactiveTutorialConstant.triggers;
  private backTriggerFrom;
  private triggers;
  private interactiveTutorialConstant: any;  
  constructor(
    // private navController: NavController,
    private cd: ChangeDetectorRef,
    // private deeplinkService: DeeplinkService,
    // private httpApiService: HttpApiService
    private interactiveTutorialService: interactiveTutorialService,
    
  ) {}

ngOnInit() {
  this.interactiveTutorialService.getInteractiveTutorialConstants().subscribe({
    next: (data) => {
      this.interactiveTutorialConstant = data;
      console.log("this.interactiveTutorialConstant = ",this.interactiveTutorialConstant);
    },
    error: (error) => {
      console.error('Error loading interactive tutorial constants:', error);
    },
    complete: () => {
      console.log('Interactive tutorial constants loaded successfully.');
    },
  });
}

  ngAfterViewInit() {
    if (this.riveCanvas) {
      this.updateCanvasResolution();
    }
  }

  shoot() {
    try {
      this.confetti({
        particleCount: 555,
        origin: { y: 0.5 },
      });
    } catch (e) {}
  }

  confetti(args: any) {
    return window['confetti'].apply(this, arguments);
  }

  onLanguageSelection(lang: string) {
    this.showLanguageSelection = false;
    if (lang) {
      this.showInteractiveVideo = true;
      this.videoSource = 'intro.riv';
      this.playRiveAnimation(this.videoSource);
    }
  }

  playHand2onClick() {
    this.isHand1Winner = false;
    this.is1stTimeUser.hand1 = false;
    this.showInteractiveVideo = true;
    this.videoSource = 'hand_2.riv';
    this.currentArtBoard = 'Artboard01';
    this.playRiveAnimation(this.videoSource);
  }

  playRiveAnimation(videoSource: string) {
    this.videoSource = videoSource;

    if (!this.riveCanvas) {
      return;
    }

    this.stopCurrentAudio();

    this.rive = new Rive({
      src: `${this.interactiveTutorialConstant?.assetsPath}${videoSource}`,
      canvas: this.riveCanvas.nativeElement,
      autoplay: true,
      stateMachines: this.interactiveTutorialConstant?.stateMachine,
      layout: new Layout({
        fit: Fit.Contain,
        alignment: Alignment.TopCenter,
      }),
      onLoad: () => {
        this.rive.resizeDrawingSurfaceToCanvas();
        setTimeout(() => {
          this.setCurrentTriggerValues();
        });
        setTimeout(() => {
          this.fireCurrentTriggerValues();
        }, 100);
      },
      onStateChange: (event) => {
        this.handleStateChange(event);
      },
    });
  }
  setCurrentTriggerValues() {
    const inputs = this.rive.stateMachineInputs(
      this.interactiveTutorialConstant?.stateMachine
    );
    for (let i = 0; i < inputs?.length; i++) {
      let currentValue = inputs[i];
      if (currentValue.name === 'Sound') {
        this.soundTrigger = currentValue;
      } else if (currentValue.name === 'play_pause') {
        this.playPauseTrigger = currentValue;
      } else if (currentValue.name === 'back_start') {
        this.triggers.intro.lastTimelineValue = currentValue;
      } else if (this.videoSource === 'hand_1.riv') {
        if (currentValue.name === 'Back_trigger_0') {
          this.triggers.hand1.lastTimelineValue.a1 = currentValue;
        } else if (currentValue.name === 'Back_trigger_1') {
          this.triggers.hand1.lastTimelineValue.a2 = currentValue;
        } else if (currentValue.name === 'Back_trigger_3') {
          this.triggers.hand1.lastTimelineValue.a3 = currentValue;
        }
      } else if (this.videoSource === 'hand_2.riv') {
        if (currentValue.name === 'Back_trigger_0') {
          this.triggers.hand2.lastTimelineValue.a1 = currentValue;
        } else if (currentValue.name === 'Back_trigger_2') {
          this.triggers.hand2.lastTimelineValue.a2 = currentValue;
        }
      }
    }
  }
  fireCurrentTriggerValues() {
    if (this.audioStatus === 'Sound') {
      this.soundTrigger.value = true;
    } else {
      this.soundTrigger.value = false;
    }
    if (this.triggers.intro.playLastTimeline) {
      this.triggers.intro.lastTimelineValue.fire();
      this.triggers.intro.playLastTimeline = false;
    } else if (this.triggers.hand1.playLastTimeline.a1) {
      this.triggers.hand1.lastTimelineValue.a1.fire();
      this.triggers.hand1.playLastTimeline.a1 = false;
    } else if (this.triggers.hand1.playLastTimeline.a2) {
      this.triggers.hand1.lastTimelineValue.a2.fire();
      this.triggers.hand1.playLastTimeline.a2 = false;
    } else if (this.triggers.hand1.playLastTimeline.a3) {
      this.triggers.hand1.lastTimelineValue.a3.fire();
      this.triggers.hand1.playLastTimeline.a3 = false;
    } else if (this.triggers.hand2.playLastTimeline.a1) {
      this.triggers.hand2.lastTimelineValue.a1.fire();
      this.triggers.hand2.playLastTimeline.a1 = false;
    } else if (this.triggers.hand2.playLastTimeline.a2) {
      this.triggers.hand2.lastTimelineValue.a2.fire();
      this.triggers.hand2.playLastTimeline.a2 = false;
    }
  }
  handleStateChange(event: any) {
    const data = event.data;
    console.log("data = ",data)
    const timeline = data.length === 2 ? data[1] : data[0];

    this.playAudioForTimeline(timeline.trim());
    if (timeline === 'Timeline 14 (10)' && this.videoSource === 'intro.riv') {
      if (!this.backTriggerFrom.intro && timeline === 'intro.riv') {
        this.videoSource = 'hand_1.riv';
        this.currentArtBoard = 'Artboard01';
        this.nextRive(this.videoSource, this.currentArtBoard);
      } else if (this.backTriggerFrom.intro) {
        this.videoSource = 'intro.riv';
        this.currentArtBoard = '';
        this.nextRive(this.videoSource, this.currentArtBoard);
      }
    } else if (timeline === 'back_trigger_h1_0') {
      this.triggers.intro.playLastTimeline = true;
      this.videoSource = 'intro.riv';
      this.currentArtBoard = '';
      this.backTriggerFrom.intro = true;
      this.nextRive('intro.riv', 'New Artboard');
      this.playAudioForTimeline('Timeline 14 (10)');
    } else if (timeline === 'Back_trigger_2') {
      if (this.currentArtBoard === 'Artboard02') {
        this.triggers.hand1.playLastTimeline.a1 = true;

        this.videoSource = 'hand_1.riv';
        this.currentArtBoard = 'Artboard01';
        this.backTriggerFrom.h1.a1 = true;
        this.nextRive(this.videoSource, this.currentArtBoard);
        this.playAudioForTimeline('Timeline 12 (11)');
      } else if (this.currentArtBoard === 'Artboard03') {
        this.triggers.hand1.playLastTimeline.a2 = true;

        this.videoSource = 'hand_1.riv';
        this.currentArtBoard = 'Artboard02';
        this.backTriggerFrom.h1.a2 = true;
        this.nextRive(this.videoSource, this.currentArtBoard);
        this.playAudioForTimeline('Timeline 11 (10)');
      }
    } else if (timeline === 'Back_trigger_3') {
      if (this.currentArtBoard === 'Artbaord04') {
        this.triggers.hand1.playLastTimeline.a3 = true;
        this.videoSource = 'hand_1.riv';
        this.currentArtBoard = 'Artboard03';
        this.backTriggerFrom.h1.a3 = true;
        this.nextRive(this.videoSource, this.currentArtBoard);
        this.playAudioForTimeline('Timeline 16 (6)');
      }
    } else if (timeline === 'next_trigger H_1') {
      this.videoSource = 'hand_1.riv';
      this.currentArtBoard = 'Artboard01';
      this.nextRive(this.videoSource, this.currentArtBoard);
    } else if (this.videoSource === 'hand_1.riv') {
      if (
        timeline === 'next_trigger_1' &&
        this.currentArtBoard === 'Artboard01'
      ) {
        this.videoSource = 'hand_1.riv';
        this.currentArtBoard = 'Artboard02';
        this.rive.volume = 0;
        this.nextRive(this.videoSource, this.currentArtBoard);
      } else if (
        timeline === 'next_trigger_2' &&
        this.currentArtBoard === 'Artboard02'
      ) {
        this.videoSource = 'hand_1.riv';
        this.rive.volume = 0;
        this.currentArtBoard = 'Artboard03';
        this.nextRive(this.videoSource, this.currentArtBoard);
      } else if (
        timeline === 'next_trigger_3' &&
        this.currentArtBoard === 'Artboard03'
      ) {
        this.videoSource = 'hand_1.riv';
        this.rive.volume = 0;
        this.currentArtBoard = 'Artbaord04';
        this.nextRive(this.videoSource, this.currentArtBoard);
      } else if (
        (timeline === 'Timeline 40' || timeline === 'Finished') &&
        this.currentArtBoard === 'Artbaord04'
      ) {
        setTimeout(() => {
          this.isHand1Winner = true;
          this.is1stTimeUser.hand1 = true;
          this.grantBenefits({ handPlayed: 'f' });
          this.showInteractiveVideo = false;
          this.currentArtBoard = '';
          this.videoSource = '';
          if (this.rive) {
            this.rive?.stop();
            this.rive?.cleanup();
          }
          this.shoot();
          this.cd.detectChanges();
        }, 1000);
      }
    }

    if (this.videoSource === 'hand_2.riv') {
      if (timeline === 'next_trigger_1') {
        this.videoSource = 'hand_2.riv';
        this.rive.volume = 0;
        this.currentArtBoard = 'Artboard02';
        this.nextRive(this.videoSource, this.currentArtBoard);
      } else if (timeline === 'next_trigger_2') {
        this.videoSource = 'hand_2.riv';
        this.rive.volume = 0;
        this.currentArtBoard = 'Artboard03';
        this.nextRive(this.videoSource, this.currentArtBoard);
      } else if (
        timeline === 'Back_trigger_1' &&
        this.currentArtBoard === 'Artboard02'
      ) {
        if (this.currentArtBoard === 'Artboard02') {
          this.triggers.hand2.playLastTimeline.a1 = true;
          this.videoSource = 'hand_2.riv';
          this.currentArtBoard = 'Artboard01';
          this.backTriggerFrom.h2.a1 = true;
          this.nextRive(this.videoSource, this.currentArtBoard);
          this.playAudioForTimeline('Timeline 11 (11)');
        }
      } else if (timeline === 'Back_trigger_3') {
        if (this.currentArtBoard === 'Artboard03') {
          this.triggers.hand2.playLastTimeline.a2 = true;
          this.triggers.intro.playLastTimeline = false;
          this.videoSource = 'hand_2.riv';
          this.currentArtBoard = 'Artboard02';
          this.backTriggerFrom.h2.a2 = true;
          this.nextRive(this.videoSource, this.currentArtBoard);
          this.playAudioForTimeline('Timeline 8 (8)');
        }
      } else if (
        timeline === 'Timeline 8 (8)' &&
        this.currentArtBoard === 'Artboard03'
      ) {
        setTimeout(() => {
          this.isHand2Winner = true;
          this.is1stTimeUser.hand2 = true;
          this.showInteractiveVideo = false;
          this.grantBenefits({ handPlayed: 's' });
          this.isHand1Winner = false;
          this.is1stTimeUser.hand1 = false;
          this.currentArtBoard = '';
          this.videoSource = '';
          if (this.rive) {
            this.rive?.stop();
            this.rive?.cleanup();
          }
          this.shoot();
          this.cd.detectChanges();
        }, 2000);
      }
    }

    if (timeline == 'pause') {
      if (this.currentAudio) {
        this.currentAudio.pause();
      }
      this.isVideoPaused = true;
      this.rive.pause();
    }

    if (timeline === 'Mute' || timeline === 'Sound') {
      this.audioStatus = timeline;
      this.muteUnmuteAudio(timeline);
    } else {
      this.muteUnmuteAudio(this.audioStatus);
    }
  }

  grantBenefits(param: any) {
  //call api
  }

  playVideo() {
    if (this.isVideoPaused) {
      if (this.currentAudio) {
        this.currentAudio.play();
      }
      this.playPauseTrigger.value = true;
      this.rive.play();
      this.isVideoPaused = false;
    }
  }

  playAudioForTimeline(timeline: string) {
    let audioMapping = {};

    if (this.videoSource === 'intro.riv' || this.backTriggerFrom?.intro) {
      audioMapping = this.interactiveTutorialConstant?.audioMap?.intro;
      if (
        timeline === 'Timeline 14 (10)' &&
        this.backTriggerFrom.intro &&
        this.videoSource === 'intro.riv'
      ) {
        this.backTriggerFrom.intro = false;
      }
    } else if (this.videoSource === 'hand_1.riv') {
      if (this.currentArtBoard === 'Artboard01' || this.backTriggerFrom.h1.a1) {
        audioMapping = this.interactiveTutorialConstant?.audioMap?.hand1?.artBoard1;
        if (
          timeline === 'Timeline 12 (11)' &&
          this.backTriggerFrom.h1.a1 &&
          this.videoSource === 'hand_1.riv'
        ) {
          this.backTriggerFrom.h1.a1 = false;
        }
      } else if (this.currentArtBoard === 'Artboard02') {
        audioMapping = this.interactiveTutorialConstant?.audioMap?.hand1?.artBoard2;
      } else if (this.currentArtBoard === 'Artboard03') {
        audioMapping = this.interactiveTutorialConstant?.audioMap?.hand1?.artBoard3;
      } else if (this.currentArtBoard === 'Artbaord04') {
        audioMapping = this.interactiveTutorialConstant?.audioMap?.hand1?.artBoard4;
      }
    } else if (this.videoSource === 'hand_2.riv') {
      if (this.currentArtBoard === 'Artboard01') {
        audioMapping = this.interactiveTutorialConstant?.audioMap?.hand2?.artBoard1;
      }
      if (this.currentArtBoard === 'Artboard02') {
        audioMapping = this.interactiveTutorialConstant?.audioMap?.hand2?.artBoard2;
      }
      if (this.currentArtBoard === 'Artboard03') {
        audioMapping = this.interactiveTutorialConstant?.audioMap?.hand2?.artBoard3;
      }
    }

    const audioSrc = audioMapping[timeline];
    if (audioSrc) {
      this.playAudio(audioSrc);
    }
  }

  playAudio(audioSrc: string) {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }

    if (audioSrc) {
      this.currentAudio = new Audio(audioSrc);
      this.currentAudio?.play();
    }
  }

  nextRive(videoSource: string, artboard: string) {
    if (this.rive) {
      this.stopCurrentAudio();
      this.rive.load({
        src: `${this.interactiveTutorialConstant?.assetsPath}${videoSource}`,
        autoplay: true,
        artboard: artboard,
        stateMachines: [this.interactiveTutorialConstant?.stateMachine],
      } as any);
    }
  }

  stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  muteUnmuteAudio(action: string) {
    this.audioStatus = action;
    if (this.currentAudio) {
      this.currentAudio.volume = action === 'Mute' ? 0 : 1;
    }
  }

  updateCanvasResolution() {
    const canvas = this.riveCanvas.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  stopAnimation(isGoBack: boolean = true) {
    if (this.rive) {
      this.rive.stop();
      this.rive.cleanup();
    }
    this.stopCurrentAudio();
    this.videoSource = '';
    this.showInteractiveVideo = false;
    this.showLanguageSelection = true;
    this.isHand1Winner = false;
    this.is1stTimeUser.hand1 = false;
    this.is1stTimeUser.hand2 = false;
    this.isHand2Winner = false;
    this.showInteractiveContainer = true
  
  }

  redirectFromHand1Completion(redirectTo: string = 'sng') {
    if (this.rive) {
      this.rive.stop();
      this.rive.cleanup();
    }
    this.stopCurrentAudio();
    this.showInteractiveContainer = false;
    if (redirectTo === 'sng') {
      console.log('redirecting to sng from hand1');
     
      this.showInteractiveContainer = true;
    } else {
      console.log('redirecting to lobby from hand1');
      //redirect to lobby
    }
  }

  redirectFromHand2AfterCompletion(redirectTo: string = 'tournament') {
    if (this.rive) {
      this.rive.stop();
      this.rive.cleanup();
    }
    this.stopCurrentAudio();
    this.showInteractiveContainer = false;

    if (redirectTo === 'tournament') {
      console.log('redirecting to tounament from hand2');
      // this.deeplinkService.getRoutingParams(
      //   '?actiontype=tabclick&moveToScreen=TOURNAMENT'
      // );
    } else {
      console.log('redirecting to lobby from hand2');
      //redirect to  lobby
    }
  }

  redirectToHand1() {
    this.isHand1Winner = false;
    this.is1stTimeUser.hand1 = false;
    this.is1stTimeUser.hand2 = false;
    this.isHand2Winner = false;
    this.onLanguageSelection('English');
  }

  ngOnDestroy() {
    this.stopAnimation(false);
    if (this.rive) {
      this.rive.stop();
      this.rive.cleanup();
    }
  }
}
