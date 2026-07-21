![Mindsphere](https://raw.githubusercontent.com/Reinaldo-Fernandes/mindshirelite/efefea87a5e3000e39c5b916d8a22bc0124955bc/Mindsphere.png)

# 🧠 MindSphere — Focus Ecosystem for Neurodivergent Minds

> *"Productivity is not a straight line. Every brain has its own rhythm, its own pauses, and its own colors."*

**MindSphere** is a focus environment designed specifically for neurodivergent individuals (ADHD, Autism, ODD, and OCD). Instead of the rigid, punishing structure of traditional productivity tools, it uses **adaptive design**, **immersive soundscapes**, and **sensory-aware UI patterns** to turn time management into a low-pressure, engaging experience.

This is the **full version** of the project, including user accounts, cloud sync, and gamification. A lighter, no-login **Demo Edition** is also available — see.

---

## 🚀 UX & Engineering Highlights (Calm Tech)

- **Contextual Assistant — Orbit:** explains features on hover (desktop) or tap (mobile), lowering the barrier to entry for first-time users.
- **Panic Mode:** a global emergency trigger that instantly mutes all audio and dims visual stimuli during sensory overload.
- **Glassmorphism Interface:** a `backdrop-filter`-based aesthetic built to reduce visual clutter and cognitive load.
- **Virtual Body Doubling:** Orbit provides light, non-invasive feedback during focus cycles — company without pressure.

---

## 🛸 Key Features

| Feature | Technical Implementation | Neurodivergent Impact |
|---|---|---|
| **Panic Mode ⚠️** | Global `dblclick` reset handler | Mutes audio and dims the UI instantly during a sensory meltdown |
| **Sensory Settings 🧠** | CSS filters + UI toggles | Disable background animations, the garden, or enable grayscale mode |
| **Goblin Mode 👹** | Task-splitting algorithm | Reduces decision paralysis by breaking a task into 3 smaller steps |
| **Neurological Lenses** | Dynamic color theming | Adjusts the visual environment (Dopamine, Serenity, Autonomy) |
| **Sensory Mixer** | Web Audio API | Layered ambient sound (rain, fire) for acoustic isolation |
| **Accounts & Sync** | Firebase Auth + Firestore | Cross-device progress: XP, achievements, Goblin history |

---

## 🛠️ Tech Stack

- **Frontend:** Semantic HTML5, CSS3 (custom properties, Flexbox, Grid, keyframe animations)
- **Logic:** Vanilla JavaScript (ES6+), Web Audio API
- **Graphics:** Three.js (procedural background)
- **Backend & Persistence:**
  - **Firebase Authentication** — account creation, login, password recovery
  - **Cloud Firestore** — real-time sync for XP, achievements, and Goblin history, protected by [Firestore Security Rules](#security)

---

## 📱 Mobile-First & Accessibility

The layout is fully responsive (`mobile.css`), designed around thumb-reach zones for one-handed use. Touch gestures and simplified interactions ensure the Sensory Mixer and Orbit Assistant work smoothly on small screens. Users can also disable background motion and enable grayscale mode for sensory comfort.

---

## 🗺️ Roadmap

- [ ] Binaural / layered ambient audio for deeper focus
- [ ] Exportable focus reports for therapists and coaches
- [ ] Group "Guilds" for collaborative body doubling
- [ ] Server-side XP validation (Cloud Functions) to replace client-side rate limiting

---

## 📝 License & Credits

Developed by **Reinaldo Fernandes**.
This project is an open-source initiative supporting the neurodivergent community. Contributions are welcome — please open an issue or pull request. ✨

Licensed under the [MIT License](./LICENSE) *(add a `LICENSE` file to your repo if you haven't yet — GitHub can generate one for you in a few clicks).*
