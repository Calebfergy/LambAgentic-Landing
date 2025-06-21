<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LambAgentic | Tech for the Future</title>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500&family=Open+Sans&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      font-family: 'Open Sans', sans-serif;
      background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
      color: #f0f0f0;
      scroll-behavior: smooth;
    }
    header {
      background: rgba(22, 27, 34, 0.9);
      padding: 50px 20px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.6);
    }
    header h1 {
      margin: 0;
      font-size: 3.5rem;
      font-family: 'Orbitron', sans-serif;
      color: #58a6ff;
      letter-spacing: 2px;
      animation: glow 2s ease-in-out infinite alternate;
    }
    header p {
      font-size: 1.2rem;
      margin-top: 10px;
      color: #8b949e;
    }
    @keyframes glow {
      from { text-shadow: 0 0 5px #58a6ff; }
      to { text-shadow: 0 0 20px #58a6ff, 0 0 30px #58a6ff; }
    }
    nav {
      background: #21262d;
      display: flex;
      justify-content: center;
      gap: 40px;
      padding: 15px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    nav a {
      color: #58a6ff;
      text-decoration: none;
      font-weight: bold;
      font-size: 1.1rem;
      transition: color 0.3s;
    }
    nav a:hover {
      color: #79c0ff;
    }
    main {
      padding: 60px 20px;
      text-align: center;
      max-width: 900px;
      margin: auto;
    }
    section {
      margin-bottom: 60px;
      animation: fadeInUp 1.5s ease;
    }
    main h2 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      color: #58a6ff;
    }
    p {
      font-size: 1.1rem;
      line-height: 1.6;
    }
    .ai-call-button {
      display: inline-block;
      background: #58a6ff;
      color: #0d1117;
      padding: 15px 30px;
      font-size: 1.1rem;
      border: none;
      border-radius: 30px;
      font-weight: bold;
      text-decoration: none;
      transition: background 0.3s ease, transform 0.2s ease;
      box-shadow: 0 4px 15px rgba(88, 166, 255, 0.4);
    }
    .ai-call-button:hover {
      background: #79c0ff;
      transform: scale(1.05);
    }
    footer {
      background: #161b22;
      text-align: center;
      padding: 30px 20px;
      font-size: 0.95rem;
      color: #8b949e;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <header>
    <h1>LambAgentic</h1>
    <p>Empowering Tech. Emboldening Ideas.</p>
  </header>
  <nav>
    <a href="#about">About</a>
    <a href="#services">Services</a>
    <a href="#contact">Contact</a>
  </nav>
  <main>
    <section id="about">
      <h2>Who We Are</h2>
      <p>LambAgentic is a bold new force in technology, crafting intelligent solutions that are lean, agile, and forward-looking.</p>
    </section>
    <section id="services">
      <h2>What We Do</h2>
      <p>From AI-powered web tools to automation services, we streamline processes and elevate user experience through cutting-edge innovation.</p>
    </section>
    <section id="contact">
      <h2>Get in Touch</h2>
      <p>Email us at <a href="mailto:info@lambagentic.com" style="color:#79c0ff">info@lambagentic.com</a></p>
      <p>
        <a class="ai-call-button" href="tel:+18005550199">Give Our AI Agent a Call</a>
      </p>
    </section>
  </main>
  <footer>
    &copy; 2025 LambAgentic. All rights reserved.
  </footer>
</body>
</html>
