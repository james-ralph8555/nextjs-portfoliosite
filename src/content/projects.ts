const projectsConfig = {
  title: "Projects",
  items: [
    {
      title: "fdnix",
      summary:
        "Fast, relevant, filterable search for the Nix packages collection. Blends keyword matching with semantic (vector) search to find the right package quickly.",
      image: null,
      url: "https://fdnix.com",
      github: "james-ralph8555/fdnix",
    },
    {
      title: "HomeBench",
      summary:
        "A privacy-by-design in-browser SQL workbench powered by DuckDB-WASM. Analyze your data locally without sending it to a server.",
      image: null,
      url: "https://homebench.casa",
      github: "james-ralph8555/homebench",
    },
    {
      title: "Real-Time Black Hole Simulator",
      summary:
        "A real-time black hole simulator built with Rust, WebAssembly & WebGPU. Explore gravitational lensing effects interactively in your browser.",
      image: "/black-hole-laboratory.webp",
      url: "https://gravitylens.space",
      github: "james-ralph8555/black-hole-laboratory",
    },
    {
      title: "Options Visualizer",
      summary:
        "Tool to visualize changes in the Black–Scholes model with respect to other variables. 2D or 3D data output. Can also be used to get current Greeks for a given option. European style options.",
      image: "/optvis_thumb.webp",
      url: "https://github.com/james-ralph8555/optionsVisualizer",
      github: "james-ralph8555/optionsVisualizer",
    },
    {
      title: "Personal Portfolio Website",
      summary:
        "A static portfolio website built with Next.js 15, featuring interactive project cards with GitHub stars, a markdown-powered blog system, and optimized for AWS Amplify hosting",
      image: "/portfolio-thumb.webp",
      url: "https://james-ralph.com",
      github: "james-ralph8555/nextjs-portfoliosite",
    },
    {
      title: "chickhen.xyz",
      summary:
        "A website built in gatsby.js with hosting and CI/CD provided by AWS Amplify",
      image: "/avatar_thumb.webp",
      url: "https://chickhen.xyz",
      github: null,
    },
    {
      title: "Drexel Micromouse 2020",
      summary:
        "Won 1st prize in the 2020 Princeton Micromouse competition using the A* algorithm implemented in Python",
      image: "/micromouse_thumb.webp",
      url: "https://github.com/james-ralph8555/DrexelMicromouse2020",
      github: "james-ralph8555/DrexelMicromouse2020",
    },
  ],
} as const;

export default projectsConfig;

