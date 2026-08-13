export const SCENE_CONFIG = [
  {
    id: 'scene_01',
    title: 'Scene 1: Introduction to the Zoo',
    type: 'sequential_videos',
    videos: [
      {
        id: 'part_1',
        name: 'scene_01_cutscene_part1.mp4',
        title: 'Part 1: Going to the Zoo',
        subtitle: 'Miss Sophie & Milo start their journey!',
        fallbackTitle: '🎬 Cutscene Part 1: Departure',
        fallbackBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
      },
      {
        id: 'part_2',
        name: 'scene_01_cutscene_part2.mp4',
        title: 'Part 2: On the Bus',
        subtitle: 'Singing songs on the way to the zoo',
        maxDuration: 4,
        transitionDuration: 1000,
        fallbackTitle: '🚌 Cutscene Part 2: Bus Ride',
        fallbackBg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
      },
      {
        id: 'part_3',
        name: 'scene_01_cutscene_part3.mp4',
        title: 'Part 3: Arrival at Zoo Gates',
        subtitle: 'Ready to see amazing animals!',
        fallbackTitle: '🦁 Cutscene Part 3: Arrival at Zoo',
        fallbackBg: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
      }
    ]
  },
  {
    id: 'scene_02',
    title: 'Scene 2: Find & Learn Animals',
    type: 'interactive_zoo',
    currentAnimal: 'lion',
    animals: {
      lion: {
        id: 'lion',
        displayName: 'Lion',
        targetWord: 'lion',
        hotspot: {
          top: '20%',
          left: 'calc(5% - 25px)',
          width: '22%',
          height: '32%'
        },
        steps: [
          {
            id: 'dialogue_1',
            name: 'scene_02_lion_01_dialogue_milo_choice.mp4',
            title: 'Milo wants to see Lion!',
            isLoop: false
          },
          {
            id: 'dialogue_2',
            name: 'scene_02_lion_02_dialogue_user_prompt.mp4',
            title: 'Where is the Lion?',
            isLoop: false
          },
          {
            id: 'hotspot_loop',
            name: 'scene_02_lion_03_hotspot_loop.mp4',
            title: 'Find the Lion!',
            isLoop: true,
            isHotspotStep: true,
            coachmarkDelayMs: 5000
          },
          {
            id: 'appreciate_explain',
            name: 'scene_02_lion_04_appreciate_explain.mp4',
            title: 'Great Job Finding Lion!',
            isLoop: false
          },
          {
            id: 'detail_explain',
            name: 'scene_02_lion_05_detail_explain.mp4',
            title: 'Lion Facts',
            isLoop: false
          },
          {
            id: 'speak_prompt',
            name: 'scene_02_lion_06_speak_prompt.mp4',
            title: 'Can you say Lion?',
            isLoop: false
          },
          {
            id: 'speak_loop',
            name: 'scene_02_lion_07_speak_loop.mp4',
            title: 'Say: "LION"',
            isLoop: true,
            isSpeechStep: true,
            targetWord: 'lion'
          },
          {
            id: 'speech_success',
            name: 'scene_02_lion_08_speech_success.mp4',
            title: 'Awesome job saying Lion!',
            isLoop: false
          }
        ]
      },
      giraffe: {
        id: 'giraffe',
        displayName: 'Giraffe',
        targetWord: 'giraffe',
        hotspot: {
          top: '8%',
          left: '56%',
          width: '20%',
          height: '42%'
        },
        steps: [
          {
            id: 'appreciate_explain',
            name: 'scene_02_giraffe_04_appreciate_explain.mp4',
            title: 'Great Job Finding Giraffe!',
            isLoop: false
          },
          {
            id: 'detail_explain',
            name: 'scene_02_giraffe_05_detail_explain.mp4',
            title: 'Giraffe Facts',
            isLoop: false
          },
          {
            id: 'speak_prompt',
            name: 'scene_02_giraffe_06_speak_prompt.mp4',
            title: 'Can you say Giraffe?',
            isLoop: false
          },
          {
            id: 'speak_loop',
            name: 'scene_02_giraffe_07_speak_loop.mp4',
            title: 'Say: "GIRAFFE"',
            isLoop: true,
            isSpeechStep: true,
            targetWord: 'giraffe'
          },
          {
            id: 'speech_success',
            name: 'scene_02_giraffe_08_speech_success.mp4',
            title: 'Awesome job saying Giraffe!',
            isLoop: false
          }
        ]
      },
      elephant: {
        id: 'elephant',
        displayName: 'Elephant',
        targetWord: 'elephant',
        hotspot: {
          top: '28%',
          left: '74%',
          width: '22%',
          height: '38%'
        },
        steps: [
          {
            id: 'appreciate_explain',
            name: 'scene_02_elephant_04_appreciate_explain.mp4',
            title: 'Great Job Finding Elephant!',
            isLoop: false
          },
          {
            id: 'detail_explain',
            name: 'scene_02_elephant_05_detail_explain.mp4',
            title: 'Elephant Facts',
            isLoop: false
          },
          {
            id: 'speak_prompt',
            name: 'scene_02_elephant_06_speak_prompt.mp4',
            title: 'Can you say Elephant?',
            isLoop: false,
            isSpeechStep: true,
            targetWord: 'elephant'
          },
          {
            id: 'speech_success',
            name: 'scene_02_elephant_08_speech_success.mp4',
            title: 'Awesome job saying Elephant!',
            isLoop: false
          }
        ]
      },
      panda: {
        id: 'panda',
        displayName: 'Panda',
        targetWord: 'panda',
        hotspot: {
          top: '15%',
          left: '26%',
          width: '18%',
          height: '25%'
        },
        steps: [
          {
            id: 'appreciate_explain',
            name: 'scene_02_panda_04_appreciate_explain.mp4',
            title: 'Great Job Finding Panda!',
            isLoop: false
          },
          {
            id: 'detail_explain',
            name: 'scene_02_panda_05_detail_explain.mp4',
            title: 'Panda Facts',
            isLoop: false
          },
          {
            id: 'speak_prompt',
            name: 'scene_02_panda_06_speak_prompt.mp4',
            title: 'Can you say Panda?',
            isLoop: false,
            isSpeechStep: true,
            targetWord: 'panda'
          },
          {
            id: 'speech_success',
            name: 'scene_02_panda_08_speech_success.mp4',
            title: 'Awesome job saying Panda!',
            isLoop: false
          }
        ]
      },
      fish: {
        id: 'fish',
        displayName: 'Fish',
        targetWord: 'fish',
        hotspot: {
          top: '55%',
          left: '42%',
          width: '22%',
          height: '30%'
        },
        steps: [
          {
            id: 'appreciate_explain',
            name: 'scene_02_fish_04_appreciate_explain.mp4',
            title: 'Great Job Finding Fish!',
            isLoop: false
          },
          {
            id: 'detail_explain_1',
            name: 'scene_02_fish_05_detail_explain_01.mp4',
            title: 'Fish Facts Part 1',
            isLoop: false
          },
          {
            id: 'detail_explain_2',
            name: 'scene_02_fish_05_detail_explain_02.mp4',
            title: 'Fish Facts Part 2',
            isLoop: false
          },
          {
            id: 'speak_prompt',
            name: 'scene_02_fish_06_speak_prompt.mp4',
            title: 'Can you say Fish?',
            isLoop: false,
            isSpeechStep: true,
            targetWord: 'fish'
          },
          {
            id: 'speech_success',
            name: 'scene_02_fish_08_speech_success.mp4',
            title: 'Awesome job saying Fish!',
            isLoop: false
          }
        ]
      }
    }
  },
  {
    id: 'scene_03',
    title: 'Scene 3: Animal Feeding Activity',
    type: 'matching',
    titleText: 'Feed the Animals!',
    introVideo: 'scene_03_matching_01_intro.mp4',
    loopVideo: 'scene_03_matching_02_loop_waiting.mp4',
    apprecationVideo: 'scene_03_matching_03_appreciation.mp4'
  },
  {
    id: 'scene_05',
    title: 'Scene 5: 1-on-1 Chat with Milo',
    type: 'milo_1on1',
    talkVideo: 'scene_05_milo talk.mp4',
    idleVideo: 'scene_05_milo idle.mp4',
    steps: [
      {
        stepIndex: 0,
        type: 'milo_talking',
        audio: 'scene_05_milo intro.mp3'
      },
      {
        stepIndex: 1,
        type: 'user_speaking',
        prompt: 'Say something to Milo! 🎙️'
      },
      {
        stepIndex: 2,
        type: 'milo_talking',
        audio: 'scene_05_milo answer 1.mp3'
      },
      {
        stepIndex: 3,
        type: 'user_speaking',
        prompt: 'Answer Milo! 🎙️'
      },
      {
        stepIndex: 4,
        type: 'milo_talking',
        audio: 'scene_05_milo answer 2.mp3'
      },
      {
        stepIndex: 5,
        type: 'user_speaking',
        prompt: 'Your turn to speak! 🎙️'
      },
      {
        stepIndex: 6,
        type: 'milo_talking',
        audio: 'scene_05_milo answer 3.mp3'
      },
      {
        stepIndex: 7,
        type: 'user_speaking',
        prompt: 'Talk to Milo! 🎙️'
      },
      {
        stepIndex: 8,
        type: 'milo_talking',
        audio: 'scene_05_milo answer 4.mp3'
      },
      {
        stepIndex: 9,
        type: 'user_speaking',
        prompt: 'Your turn to speak! 🎙️'
      },
      {
        stepIndex: 10,
        type: 'milo_talking',
        audio: 'scene_05_milo answer 5.mp3'
      },
      {
        stepIndex: 11,
        type: 'user_speaking',
        prompt: 'Answer Milo! 🎙️'
      },
      {
        stepIndex: 12,
        type: 'milo_talking',
        audio: 'scene_05_milo answer 6.mp3'
      }
    ]
  }
];
