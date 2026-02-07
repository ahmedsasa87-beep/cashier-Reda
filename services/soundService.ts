
import { SoundType } from '../types';

class SoundService {
  private enabled: boolean = true;
  private volume: number = 0.3; // خفض مستوى الصوت الافتراضي ليكون مريحاً

  private sounds: Record<SoundType, HTMLAudioElement | null> = {
    // صوت نقرة خفيف واحترافي
    [SoundType.CLICK]: typeof Audio !== 'undefined' ? new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3') : null,
    // صوت نجاح هادئ
    [SoundType.SUCCESS]: typeof Audio !== 'undefined' ? new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3') : null,
    // صوت خطأ واضح ولكن غير حاد
    [SoundType.ERROR]: typeof Audio !== 'undefined' ? new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3') : null,
    // صوت إضافة للسلة سريع ولطيف
    [SoundType.ADD]: typeof Audio !== 'undefined' ? new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3') : null,
  };

  play(type: SoundType) {
    if (!this.enabled) return;
    const sound = this.sounds[type];
    if (sound) {
      sound.volume = this.volume;
      sound.currentTime = 0;
      sound.play().catch(() => {}); 
    }
  }

  setEnabled(val: boolean) { this.enabled = val; }
  setVolume(val: number) { this.volume = val; }
}

export const soundService = new SoundService();
