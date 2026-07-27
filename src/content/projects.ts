const projectsConfig = {
  title: "Projects",
  items: [
    {
      title: "Browser SQL Workbench",
      summary:
        "Privacy-first, in-browser SQL workbench powered by DuckDB-WASM.",
      image: "/assets/homebench.webp",
      url: "https://homebench.casa",
    },
    {
      title: "Real-Time Black Hole Simulator",
      summary:
        "Real-time 3D graviational lensing simulation in your browser (Rust/WebGPU/WASM).",
      image: "/assets/black-hole-laboratory.webp",
      url: "https://gravitylens.james-ralph.com/",
    },
    {
      title: "PDF Viewer & TTS Audiobook Creator",
      summary:
        "Local first, in-browser PDF viewer + neuralTTS audiobook creator",
      image: "/assets/pagesonic.webp",
      url: "https://page-sonic.com",
    },
    {
      title: "Web Audio Synthesizer",
      summary:
        "Browser synth with ADSR envelopes, filters, fx, unison, keyboard input, and live scopes.",
      image: "/assets/web_audio_synth.webp",
      url: "/synth.html",
      github: "james-ralph8555/nextjs-portfoliosite",
      githubUrl: "https://github.com/james-ralph8555/nextjs-portfoliosite/blob/main/docs/synthesizer.md",
    },
    {
      title: "Weil",
      summary:
        "Web app for OCR, translation, fine-grained review, search, and book assembly from scanned documents.",
      image: null,
      url: "https://github.com/james-ralph8555/weil",
      github: "james-ralph8555/weil",
    },
    {
      title: "portfolio-strategies",
      summary:
        "A modern web application for implementing and backtesting quantitative trading strategies.",
      image: null,
      url: "https://github.com/james-ralph8555/portfolio-strategies",
      github: "james-ralph8555/portfolio-strategies",
    },
    {
      title: "JAX RL Demo",
      summary:
        "A reinforcement learning implementation of Proximal Policy Optimization (PPO) for CartPole using JAX, with MLflow experiment tracking.",
      image: null,
      url: "https://github.com/james-ralph8555/jax-rl-demo",
      github: "james-ralph8555/jax-rl-demo",
    },
    {
      title: "fdnix",
      summary:
        "Fast, relevant, filterable search and dependency graph viewer site for the Nix packages collection. ",
      image: null,
      url: "https://github.com/james-ralph8555/fdnix",
      github: "james-ralph8555/fdnix",
    },
    {
      title: "Options Visualizer",
      summary:
        "Tool to visualize changes in the Black–Scholes model with respect to other variables. 2D or 3D data output. Can also be used to get current Greeks for a given option. European style options.",
      image: "/assets/optvis_thumb.webp",
      url: "https://github.com/james-ralph8555/optionsVisualizer",
      github: "james-ralph8555/optionsVisualizer",
    },
    {
      title: "Personal Portfolio Website",
      summary:
        "A static portfolio website built with Next.js 15, featuring interactive project cards with GitHub stars, a markdown-powered blog system, and optimized for AWS CloudFront Deployment",
      image: "/assets/portfolio-thumb.webp",
      url: "https://james-ralph.com",
      github: "james-ralph8555/nextjs-portfoliosite",
    },
    {
      title: "chickhen.xyz",
      summary:
        "A website built in gatsby.js with hosting and CI/CD provided by AWS Amplify",
      image: "/assets/avatar_thumb.webp",
      url: "https://chickhen.xyz",
      github: null,
    },
    {
      title: "Drexel Micromouse 2020",
      summary:
        "Won 1st prize in the 2020 Princeton Micromouse competition using the A* algorithm implemented in Python",
      image: "/assets/micromouse_thumb.webp",
      url: "https://github.com/james-ralph8555/DrexelMicromouse2020",
      github: "james-ralph8555/DrexelMicromouse2020",
    },
  ],
} as const;

export default projectsConfig;
