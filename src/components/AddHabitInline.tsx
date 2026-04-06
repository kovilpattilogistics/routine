"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./AddHabitInline.module.css";

interface AddHabitInlineProps {
  onSave: (data: { name: string, emoji: string, frequency: string, customDays: string[] }) => void;
  onCancel: () => void;
  groupName?: string;
}

const EMOJI_PACKAGES: Record<string, string[]> = {
  fitness: ["🏃", "🏋️", "🧘", "🏊", "🚴", "🧗"],
  sports: ["⚽", "🏀", "🎾", "🥊", "🎿", "🏄"],
  health: ["🍎", "🥗", "💧", "💪", "🥑", "🥦"],
  supplements: ["💊", "🧪", "🌿", "🩸", "🧊", "☀️"],
  mind: ["🧠", "🧘", "🍃", "🕯️", "🌊", "🌙"],
  learning: ["📚", "🖊️", "🎓", "🧠", "📖", "💻"],
  finance: ["💰", "📈", "🏦", "🧾", "💳", "🛒"],
  home: ["🧹", "🪴", "🧺", "🍳", "🏠", "🧸"],
  hobby_art: ["🎨", "📷", "🧶", "✍️", "🖼️", "🎭"],
  hobby_music: ["🎸", "🎹", "🎧", "🎤", "🎵", "📻"],
  work: ["💻", "📧", "💼", "📈", "🎯", "🗓️"],
  social: ["💬", "🤝", "📞", "👥", "🍻", "🎉"],
  self_care: ["🛀", "💆", "🧴", "🪞", "💅", "🧖"],
  morning: ["🌅", "☕", "🛏️", "🚿", "🍳", "🌞"],
  evening: ["🌙", "📖", "🍵", "😴", "🕯️", "🌌"],
  entertainment: ["🍿", "🎮", "📺", "🎬", "🎫", "🎲"],
  pets: ["🐕", "🐈", "🦴", "🐠", "🐾", "🦜"],
  nature: ["🌲", "🚶", "⛰️", "🏕️", "🚲", "🌻"],
  coding: ["👨‍💻", "🐛", "☕", "🚀", "💡", "⌨️"],
  writing: ["✍️", "📝", "📓", "💭", "✒️", "📚"],
  chores: ["🗑️", "🧼", "🛒", "🧽", "👕", "🪣"],
  default: ["✨", "✅", "🔥", "💧", "🚶", "📖"]
};

const CATEGORY_MAP: Record<string, string> = {
  // Fitness / Gym
  gym: "fitness", workout: "fitness", run: "fitness", running: "fitness", fitness: "fitness", exercise: "fitness",
  lift: "fitness", lifting: "fitness", weight: "fitness", weights: "fitness", stretch: "fitness", abs: "fitness",
  squat: "fitness", pushup: "fitness", cardio: "fitness", walk: "fitness", walking: "fitness", steps: "fitness",
  
  // Sports
  sport: "sports", sports: "sports", football: "sports", soccer: "sports", basketball: "sports", tennis: "sports",
  golf: "sports", box: "sports", boxing: "sports", ski: "sports", surf: "sports", swim: "sports", swimming: "sports",
  martial: "sports", boxing_bag: "sports", judo: "sports", volley: "sports", volleyball: "sports", climbing: "sports",
  
  // Health & Diet
  eat: "health", food: "health", water: "health", fruit: "health", diet: "health", drink: "health", meal: "health",
  cook: "health", cooking: "health", protein: "health", veg: "health", nutrition: "health", calories: "health",
  hydrate: "health", hydration: "health",
  
  // Supplements
  supplement: "supplements", supplements: "supplements", vitamin: "supplements", vitamins: "supplements",
  pill: "supplements", pills: "supplements", magnesium: "supplements", iron: "supplements", omega: "supplements",
  zinc: "supplements", creatine: "supplements", whey: "supplements", medicine: "supplements",
  
  // Mind / Mental Health
  meditate: "mind", meditation: "mind", breath: "mind", breathing: "mind", focus: "mind", zen: "mind", yoga: "mind",
  mindfulness: "mind", calm: "mind", journal: "mind", journaling: "mind", reflect: "mind", reflection: "mind",
  gratitude: "mind", therapy: "mind", pray: "mind", prayer: "mind",
  
  // Learning & Education
  study: "learning", studying: "learning", read: "learning", reading: "learning", learn: "learning", learning: "learning",
  class: "learning", course: "learning", school: "learning", homework: "learning", lecture: "learning", book: "learning",
  language: "learning", duolingo: "learning", spanish: "learning", french: "learning",
  
  // Coding / Tech
  code: "coding", coding: "coding", program: "coding", programming: "coding", dev: "coding", developer: "coding",
  software: "coding", bug: "coding", app: "coding", build: "coding", project: "coding",
  
  // Writing
  write: "writing", writing: "writing", blog: "writing", newsletter: "writing", essay: "writing", thesis: "writing",
  draft: "writing", diary: "writing", typing: "writing",
  
  // Finance
  finance: "finance", money: "finance", budget: "finance", save: "finance", saving: "finance", invest: "finance",
  investing: "finance", stocks: "finance", crypto: "finance", bills: "finance", expense: "finance", track: "finance",
  
  // Home & Chores
  clean: "chores", house: "chores", laundry: "chores", wash: "chores", sweep: "chores", vacuum: "chores",
  trash: "chores", bin: "chores", tidy: "chores", chore: "chores", chores: "chores", dishes: "chores", mop: "chores",
  grocery: "chores", groceries: "chores", shop: "chores", shopping: "chores",
  
  // Plants & Environment
  garden: "home", plant: "home", plants: "home", lawn: "home",
  
  // Art & Visual
  art: "hobby_art", draw: "hobby_art", drawing: "hobby_art", paint: "hobby_art", painting: "hobby_art",
  sketch: "hobby_art", photo: "hobby_art", photography: "hobby_art", design: "hobby_art", knit: "hobby_art",
  crochet: "hobby_art", craft: "hobby_art",
  
  // Music
  music: "hobby_music", piano: "hobby_music", guitar: "hobby_music", sing: "hobby_music", singing: "hobby_music",
  practice: "hobby_music", instrument: "hobby_music", song: "hobby_music", listen: "hobby_music", podcast: "hobby_music",
  
  // Work & Productivity
  work: "work", email: "work", emails: "work", inbox: "work", meeting: "work", meetings: "work",
  plan: "work", planning: "work", review: "work", goal: "work", sync: "work", setup: "work",
  
  // Social & Family
  social: "social", friend: "social", friends: "social", family: "social", call: "social", phone: "social",
  text: "social", chat: "social", date: "social", partner: "social", kids: "social", play: "social",
  network: "social", connect: "social",
  
  // Self Care & Hygiene
  shower: "self_care", bath: "self_care", brush: "self_care", teeth: "self_care", floss: "self_care",
  skincare: "self_care", skin: "self_care", face: "self_care", hair: "self_care", mask: "self_care",
  cream: "self_care", routine: "self_care",
  
  // Time of day
  morning: "morning", breakfast: "morning", outbed: "morning", wake: "morning",
  evening: "evening", night: "evening", bed: "evening", sleep: "evening",
  
  // Entertainment
  gaming: "entertainment", tv: "entertainment", watch: "entertainment",
  movie: "entertainment", show: "entertainment", netflix: "entertainment", playstation: "entertainment", xbox: "entertainment",
  
  // Pets
  dog: "pets", cat: "pets", feed: "pets", pet: "pets", walk_dog: "pets"
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AddHabitInline({ onSave, onCancel, groupName = "" }: AddHabitInlineProps) {
  const [name, setName] = useState("");
  
  const getContextualEmojis = () => {
    const input = (name + " " + groupName).toLowerCase();
    // Split into full words to avoid matching "art" in "start"
    const words = input.match(/\b(\w+)\b/g) || [];
    
    for (const [kw, cat] of Object.entries(CATEGORY_MAP)) {
      if (words.some(w => w === kw || w.startsWith(kw))) {
        return EMOJI_PACKAGES[cat];
      }
    }
    return EMOJI_PACKAGES.default;
  };

  const currentEmojis = getContextualEmojis();
  const [selectedEmoji, setSelectedEmoji] = useState(currentEmojis[0]);

  // Sync selected emoji when the package changes if it's not in the new package
  React.useEffect(() => {
    if (!currentEmojis.includes(selectedEmoji)) {
      setSelectedEmoji(currentEmojis[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, groupName]); // Intentionally only run when name/group change — not selectedEmoji

  const [frequency, setFrequency] = useState("daily");
  const [customDays, setCustomDays] = useState<string[]>(DAYS);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), emoji: selectedEmoji, frequency, customDays });
    setName("");
  };

  const toggleDay = (day: string) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Keyboard: Enter = save, Escape = cancel
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && name.trim()) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
    >
      <div className={styles.topRow}>
        <div className={styles.emojiPicker}>
          {currentEmojis.slice(0, 6).map((e) => (
            <button
              key={e}
              className={`${styles.emojiBtn} ${selectedEmoji === e ? styles.activeEmoji : ""}`}
              onClick={() => setSelectedEmoji(e)}
              type="button"
            >
              {e}
            </button>
          ))}
        </div>
        <input
          autoFocus
          className={styles.input}
          placeholder="Habit name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className={styles.frequencyRow}>
        <div className={styles.freqPills}>
          {["daily", "weekdays", "custom"].map(f => (
            <button 
              key={f} 
              className={`${styles.pill} ${frequency === f ? styles.activePill : ""}`}
              onClick={() => {
                setFrequency(f);
                if (f === 'weekdays') setCustomDays(DAYS.slice(0, 5));
                if (f === 'daily') setCustomDays(DAYS);
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {frequency === "custom" && (
          <div className={styles.daySelector}>
            {DAYS.map(d => (
              <button 
                key={d} 
                className={`${styles.dayBtn} ${customDays.includes(d) ? styles.activeDay : ""}`}
                onClick={() => toggleDay(d)}
              >
                {d[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        <button className={styles.saveBtn} onClick={handleSave} disabled={!name.trim()}>Save Habit</button>
      </div>
    </motion.div>
  );
}
