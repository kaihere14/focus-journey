import type { VehicleKey } from "@/config/vehicles";

const VEHICLE_SOUND_FILES: Record<VehicleKey, string> = {
  car: "/sounds/car-start.mp3",
  motorcycle: "/sounds/motorcycle-start.mp3",
  bicycle: "/sounds/bicycle-start.mp3",
  walking: "/sounds/walking-start.mp3",
};

const WIND_SOUND_FILE = "/sounds/wind.mp3";
const TRAFFIC_SOUND_FILE = "/sounds/traffic.mp3";

const WIND_VOLUME: Record<VehicleKey, number> = {
  car: 0.12,
  motorcycle: 0.22,
  bicycle: 0.28,
  walking: 0.16,
};

const WIND_SYNTH_VOLUME: Record<VehicleKey, number> = {
  car: 0.05,
  motorcycle: 0.09,
  bicycle: 0.1,
  walking: 0.06,
};

const TRAFFIC_VOLUME: Record<VehicleKey, number> = {
  car: 0.14,
  motorcycle: 0.2,
  bicycle: 0.22,
  walking: 0.18,
};

let audioContext: AudioContext | null = null;
let masterVolume = 1;
let windBaseTarget = 0;
let trafficBaseTarget = 0;

export function getJourneyVolume() {
  return masterVolume;
}

export function setJourneyVolume(volume: number) {
  masterVolume = Math.max(0, Math.min(1, volume));
  if (windEl) windEl.volume = windBaseTarget * masterVolume;
  if (windSynthNodes && audioContext) {
    windSynthNodes.gain.gain.setTargetAtTime(
      Math.max(windBaseTarget * masterVolume, 0.0001),
      audioContext.currentTime,
      0.05,
    );
  }
  if (trafficEl) trafficEl.volume = trafficBaseTarget * masterVolume;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function playSweep(
  ctx: AudioContext,
  {
    type,
    freqStart,
    freqEnd,
    duration,
    gainPeak = 0.3,
    filterFreq,
    delay = 0,
  }: {
    type: OscillatorType;
    freqStart: number;
    freqEnd: number;
    duration: number;
    gainPeak?: number;
    filterFreq?: number;
    delay?: number;
  },
) {
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, start);
  osc.frequency.linearRampToValueAtTime(freqEnd, start + duration);

  const effectivePeak = Math.max(gainPeak * masterVolume, 0.0001);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(
    effectivePeak,
    start + duration * 0.25,
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  let output: AudioNode = osc;
  if (filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    osc.connect(filter);
    output = filter;
  }
  output.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function playEngineStart(ctx: AudioContext, high: boolean) {
  playSweep(ctx, {
    type: "sawtooth",
    freqStart: high ? 150 : 55,
    freqEnd: high ? 320 : 140,
    duration: high ? 0.22 : 0.32,
    gainPeak: high ? 0.28 : 0.32,
    filterFreq: high ? 1500 : 800,
  });
  playSweep(ctx, {
    type: "sawtooth",
    freqStart: high ? 300 : 130,
    freqEnd: high ? 200 : 90,
    duration: high ? 0.4 : 0.55,
    gainPeak: high ? 0.16 : 0.18,
    filterFreq: high ? 1200 : 650,
    delay: high ? 0.2 : 0.3,
  });
}

function playBell(ctx: AudioContext) {
  playSweep(ctx, {
    type: "sine",
    freqStart: 1700,
    freqEnd: 1650,
    duration: 0.25,
    gainPeak: 0.22,
  });
  playSweep(ctx, {
    type: "sine",
    freqStart: 2200,
    freqEnd: 2150,
    duration: 0.2,
    gainPeak: 0.14,
    delay: 0.05,
  });
}

function playFootstepTap(ctx: AudioContext) {
  playSweep(ctx, {
    type: "sine",
    freqStart: 140,
    freqEnd: 90,
    duration: 0.15,
    gainPeak: 0.2,
    filterFreq: 400,
  });
}

function playSynth(vehicle: VehicleKey) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (vehicle === "car") playEngineStart(ctx, false);
  else if (vehicle === "motorcycle") playEngineStart(ctx, true);
  else if (vehicle === "bicycle") playBell(ctx);
  else playFootstepTap(ctx);
}

function playFile(path: string) {
  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(path);
    audio.volume = 0.8 * masterVolume;
    audio.addEventListener(
      "error",
      () => reject(new Error("audio load failed")),
      {
        once: true,
      },
    );
    audio.play().then(resolve).catch(reject);
  });
}

export function playJourneyStartSound(vehicle: VehicleKey) {
  playFile(VEHICLE_SOUND_FILES[vehicle]).catch(() => playSynth(vehicle));
}

let windEl: HTMLAudioElement | null = null;
let trafficEl: HTMLAudioElement | null = null;
let windSynthNodes: {
  source: AudioBufferSourceNode;
  gain: GainNode;
  lfo: OscillatorNode;
} | null = null;

type FadeHandle = { id: ReturnType<typeof setInterval> | null };
const windFade: FadeHandle = { id: null };
const trafficFade: FadeHandle = { id: null };

function fadeElementVolume(
  handle: FadeHandle,
  el: HTMLAudioElement,
  to: number,
  durationMs: number,
  onDone?: () => void,
) {
  if (handle.id !== null) clearInterval(handle.id);
  const from = el.volume;
  const steps = Math.max(1, Math.round(durationMs / 50));
  let step = 0;
  handle.id = setInterval(() => {
    step += 1;
    el.volume = Math.max(0, Math.min(1, from + (to - from) * (step / steps)));
    if (step >= steps) {
      if (handle.id !== null) clearInterval(handle.id);
      handle.id = null;
      onDone?.();
    }
  }, 50);
}

function createWindNoiseBuffer(ctx: AudioContext, seconds: number) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

function startWindSynth(vehicle: VehicleKey) {
  const ctx = getAudioContext();
  if (!ctx) return;
  stopWindSynth(0);

  const source = ctx.createBufferSource();
  source.buffer = createWindNoiseBuffer(ctx, 2);
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 500;
  filter.Q.value = 0.7;

  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.15;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 180;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  const gain = ctx.createGain();
  windBaseTarget = WIND_SYNTH_VOLUME[vehicle];
  const target = Math.max(windBaseTarget * masterVolume, 0.0001);
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(target, now + 1.2);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start();
  lfo.start();

  windSynthNodes = { source, gain, lfo };
}

function stopWindSynth(fadeSeconds = 0.8) {
  if (!windSynthNodes || !audioContext) {
    windSynthNodes = null;
    return;
  }
  const { source, gain, lfo } = windSynthNodes;
  const ctx = audioContext;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + Math.max(fadeSeconds, 0.05),
  );
  source.stop(now + fadeSeconds + 0.05);
  lfo.stop(now + fadeSeconds + 0.05);
  windSynthNodes = null;
}

export function startJourneyWind(vehicle: VehicleKey) {
  stopJourneyWind();

  const el = new Audio(WIND_SOUND_FILE);
  el.loop = true;
  el.volume = 0;
  el.addEventListener(
    "error",
    () => {
      windEl = null;
      startWindSynth(vehicle);
    },
    { once: true },
  );

  el.play()
    .then(() => {
      windEl = el;
      windBaseTarget = WIND_VOLUME[vehicle];
      fadeElementVolume(windFade, el, windBaseTarget * masterVolume, 1200);
    })
    .catch(() => {
      windEl = null;
      startWindSynth(vehicle);
    });
}

export function stopJourneyWind() {
  if (windEl) {
    const el = windEl;
    fadeElementVolume(windFade, el, 0, 800, () => {
      el.pause();
    });
    windEl = null;
  }
  stopWindSynth(0.8);
}

export function startJourneyTraffic(vehicle: VehicleKey) {
  stopJourneyTraffic();

  const el = new Audio(TRAFFIC_SOUND_FILE);
  el.loop = true;
  el.volume = 0;
  el.addEventListener(
    "error",
    () => {
      trafficEl = null;
    },
    { once: true },
  );

  el.play()
    .then(() => {
      trafficEl = el;
      trafficBaseTarget = TRAFFIC_VOLUME[vehicle];
      fadeElementVolume(
        trafficFade,
        el,
        trafficBaseTarget * masterVolume,
        1200,
      );
    })
    .catch(() => {
      trafficEl = null;
    });
}

export function stopJourneyTraffic() {
  if (!trafficEl) return;
  const el = trafficEl;
  fadeElementVolume(trafficFade, el, 0, 800, () => {
    el.pause();
  });
  trafficEl = null;
}

export function startJourneyAmbience(vehicle: VehicleKey) {
  startJourneyWind(vehicle);
  startJourneyTraffic(vehicle);
}

export function stopJourneyAmbience() {
  stopJourneyWind();
  stopJourneyTraffic();
}
