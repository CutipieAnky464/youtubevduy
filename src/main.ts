import './style.css';
import { NeonPlayApp } from './components/app';
import { initAmbient } from './utils/ambient';
import { initParticles } from './utils/particles';
import { initVisualizer } from './utils/visualizer';
import {
  initCardTilt,
  initCursorGlow,
  initMagneticButtons,
  initRippleEffect,
  initScrollReveal,
} from './utils/effects';

document.addEventListener('DOMContentLoaded', () => {
  initAmbient();

  const particleCanvas = document.getElementById('particles') as HTMLCanvasElement | null;
  if (particleCanvas) initParticles(particleCanvas);

  const visualizerCanvas = document.getElementById('visualizer') as HTMLCanvasElement | null;
  if (visualizerCanvas) initVisualizer(visualizerCanvas);

  initRippleEffect();
  initCursorGlow();
  initScrollReveal();
  initMagneticButtons();

  const videoList = document.getElementById('videoList');
  if (videoList) initCardTilt(videoList);

  const app = new NeonPlayApp();
  app.init().catch(console.error);
});
