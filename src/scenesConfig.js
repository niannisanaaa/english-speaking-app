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
      }
    }
  },
  {
    id: 'scene_03',
    title: 'Scene 3: I Spy Quiz',
    type: 'quiz',
    titleText: 'I Spy With My Little Eye...',
    introVideo: 'scene_03_ispy_01_intro.mp4',
    outroVideo: 'scene_03_ispy_05_outro_victory.mp4',
    feedbackVideos: {
      correct: 'scene_03_ispy_feedback_correct.mp4',
      wrong: 'scene_03_ispy_feedback_wrong.mp4'
    },
    quizQuestions: [
      {
        id: 'q1_panda',
        targetAnimal: 'panda',
        promptVideo: 'scene_03_ispy_02_prompt_panda.mp4',
        hintText: 'Find the PANDA eating bamboo! 🐼',
        hotspots: {
          panda: { top: '15%', left: '26%', width: '18%', height: '25%', isCorrect: true },
          lion: { top: '20%', left: 'calc(5% - 25px)', width: '22%', height: '32%', isCorrect: false },
          elephant: { top: '28%', left: '76%', width: '22%', height: '38%', isCorrect: false }
        }
      },
      {
        id: 'q2_lion',
        targetAnimal: 'lion',
        promptVideo: 'scene_03_ispy_03_prompt_lion.mp4',
        hintText: 'Find the loud LION with a big mane! 🦁',
        hotspots: {
          panda: { top: '15%', left: '26%', width: '18%', height: '25%', isCorrect: false },
          lion: { top: '20%', left: 'calc(5% - 25px)', width: '22%', height: '32%', isCorrect: true },
          elephant: { top: '28%', left: '76%', width: '22%', height: '38%', isCorrect: false }
        }
      },
      {
        id: 'q3_elephant',
        targetAnimal: 'elephant',
        promptVideo: 'scene_03_ispy_04_prompt_elephant.mp4',
        hintText: 'Find the big ELEPHANT with a trunk! 🐘',
        hotspots: {
          panda: { top: '15%', left: '26%', width: '18%', height: '25%', isCorrect: false },
          lion: { top: '20%', left: 'calc(5% - 25px)', width: '22%', height: '32%', isCorrect: false },
          elephant: { top: '28%', left: '76%', width: '22%', height: '38%', isCorrect: true }
        }
      }
    ]
  },
  {
    id: 'scene_04',
    title: 'Scene 4: Finding the Rabbit',
    type: 'voice',
    titleText: 'Call the Rabbit back!'
  }
];
