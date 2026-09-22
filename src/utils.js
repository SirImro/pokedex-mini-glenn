import { SPRITE_BASE_URL } from "./config.js";

export function getIdFromUrl(url) {
    if (!url) return "1";
    const parts = url.split("/").filter(Boolean);
    return parts[parts.length - 1];
}

export function capitalize(name) {
    if (!name) return "";
    return name.charAt(0).toUpperCase() + name.slice(1);
}

export function getSpriteUrl(id) {
    return `${SPRITE_BASE_URL}/${id}.png`;
}

export function getOfficialArtworkUrl(id) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export const TYPE_COLORS = {
    fire: { bg: "#FF4422", text: "#FFFFFF", glow: "rgba(255, 68, 34, 0.4)", icon: "🔥" },
    water: { bg: "#3399FF", text: "#FFFFFF", glow: "rgba(51, 153, 255, 0.4)", icon: "💧" },
    grass: { bg: "#77CC55", text: "#FFFFFF", glow: "rgba(119, 204, 85, 0.4)", icon: "🌿" },
    electric: { bg: "#FFCC33", text: "#000000", glow: "rgba(255, 204, 51, 0.4)", icon: "⚡" },
    ice: { bg: "#66CCFF", text: "#000000", glow: "rgba(102, 204, 255, 0.4)", icon: "❄️" },
    fighting: { bg: "#BB5544", text: "#FFFFFF", glow: "rgba(187, 85, 68, 0.4)", icon: "🥊" },
    poison: { bg: "#AA5599", text: "#FFFFFF", glow: "rgba(170, 85, 153, 0.4)", icon: "☠️" },
    ground: { bg: "#DDBB55", text: "#000000", glow: "rgba(221, 187, 85, 0.4)", icon: "🏜️" },
    flying: { bg: "#8899FF", text: "#FFFFFF", glow: "rgba(136, 153, 255, 0.4)", icon: "🕊️" },
    psychic: { bg: "#FF5599", text: "#FFFFFF", glow: "rgba(255, 85, 153, 0.4)", icon: "🔮" },
    bug: { bg: "#AABB22", text: "#FFFFFF", glow: "rgba(170, 187, 34, 0.4)", icon: "🐛" },
    rock: { bg: "#BBAA66", text: "#FFFFFF", glow: "rgba(187, 170, 102, 0.4)", icon: "🪨" },
    ghost: { bg: "#6666BB", text: "#FFFFFF", glow: "rgba(102, 102, 187, 0.4)", icon: "👻" },
    dragon: { bg: "#7766EE", text: "#FFFFFF", glow: "rgba(119, 102, 238, 0.4)", icon: "🐉" },
    dark: { bg: "#775544", text: "#FFFFFF", glow: "rgba(119, 85, 68, 0.4)", icon: "🌙" },
    steel: { bg: "#AAAABB", text: "#000000", glow: "rgba(170, 170, 187, 0.4)", icon: "⚙️" },
    fairy: { bg: "#EE99EE", text: "#000000", glow: "rgba(238, 153, 238, 0.4)", icon: "✨" },
    normal: { bg: "#AAAA99", text: "#000000", glow: "rgba(170, 170, 153, 0.4)", icon: "⚪" },
};

export function getTypeStyle(type) {
    const key = (type || "").toLowerCase();
    return TYPE_COLORS[key] || { bg: "#888888", text: "#FFFFFF", glow: "rgba(136, 136, 136, 0.4)", icon: "❓" };
}

export function formatCoins(amount) {
    return new Intl.NumberFormat("id-ID").format(amount) + " 🪙";
}

export function calculateBattleOdds(total1, total2) {
    const sum = (total1 || 300) + (total2 || 300);
    const prob1 = total1 / sum;
    const prob2 = total2 / sum;

    const odds1 = Math.max(1.15, Number((0.95 / prob1).toFixed(2)));
    const odds2 = Math.max(1.15, Number((0.95 / prob2).toFixed(2)));

    return { odds1, odds2, prob1, prob2 };
}

// -------------------------------------------------------------
// OFFLINE FALLBACK DATASET (Ensures Arena Duel loads instantly in 0ms)
// -------------------------------------------------------------
export const STATIC_POKEMON_LIST = [
    {
        id: 6,
        name: "charizard",
        types: [{ type: { name: "fire" } }, { type: { name: "flying" } }],
        stats: [
            { base_stat: 78, stat: { name: "hp" } },
            { base_stat: 84, stat: { name: "attack" } },
            { base_stat: 78, stat: { name: "defense" } },
            { base_stat: 109, stat: { name: "special-attack" } },
            { base_stat: 85, stat: { name: "special-defense" } },
            { base_stat: 100, stat: { name: "speed" } },
        ],
    },
    {
        id: 9,
        name: "blastoise",
        types: [{ type: { name: "water" } }],
        stats: [
            { base_stat: 79, stat: { name: "hp" } },
            { base_stat: 83, stat: { name: "attack" } },
            { base_stat: 100, stat: { name: "defense" } },
            { base_stat: 85, stat: { name: "special-attack" } },
            { base_stat: 105, stat: { name: "special-defense" } },
            { base_stat: 78, stat: { name: "speed" } },
        ],
    },
    {
        id: 25,
        name: "pikachu",
        types: [{ type: { name: "electric" } }],
        stats: [
            { base_stat: 60, stat: { name: "hp" } },
            { base_stat: 75, stat: { name: "attack" } },
            { base_stat: 60, stat: { name: "defense" } },
            { base_stat: 80, stat: { name: "special-attack" } },
            { base_stat: 60, stat: { name: "special-defense" } },
            { base_stat: 110, stat: { name: "speed" } },
        ],
    },
    {
        id: 150,
        name: "mewtwo",
        types: [{ type: { name: "psychic" } }],
        stats: [
            { base_stat: 106, stat: { name: "hp" } },
            { base_stat: 110, stat: { name: "attack" } },
            { base_stat: 90, stat: { name: "defense" } },
            { base_stat: 154, stat: { name: "special-attack" } },
            { base_stat: 90, stat: { name: "special-defense" } },
            { base_stat: 130, stat: { name: "speed" } },
        ],
    },
    {
        id: 149,
        name: "dragonite",
        types: [{ type: { name: "dragon" } }, { type: { name: "flying" } }],
        stats: [
            { base_stat: 91, stat: { name: "hp" } },
            { base_stat: 134, stat: { name: "attack" } },
            { base_stat: 95, stat: { name: "defense" } },
            { base_stat: 100, stat: { name: "special-attack" } },
            { base_stat: 100, stat: { name: "special-defense" } },
            { base_stat: 80, stat: { name: "speed" } },
        ],
    },
    {
        id: 448,
        name: "lucario",
        types: [{ type: { name: "fighting" } }, { type: { name: "steel" } }],
        stats: [
            { base_stat: 70, stat: { name: "hp" } },
            { base_stat: 110, stat: { name: "attack" } },
            { base_stat: 70, stat: { name: "defense" } },
            { base_stat: 115, stat: { name: "special-attack" } },
            { base_stat: 70, stat: { name: "special-defense" } },
            { base_stat: 90, stat: { name: "speed" } },
        ],
    },
    {
        id: 94,
        name: "gengar",
        types: [{ type: { name: "ghost" } }, { type: { name: "poison" } }],
        stats: [
            { base_stat: 60, stat: { name: "hp" } },
            { base_stat: 65, stat: { name: "attack" } },
            { base_stat: 60, stat: { name: "defense" } },
            { base_stat: 130, stat: { name: "special-attack" } },
            { base_stat: 75, stat: { name: "special-defense" } },
            { base_stat: 110, stat: { name: "speed" } },
        ],
    },
    {
        id: 130,
        name: "gyarados",
        types: [{ type: { name: "water" } }, { type: { name: "flying" } }],
        stats: [
            { base_stat: 95, stat: { name: "hp" } },
            { base_stat: 125, stat: { name: "attack" } },
            { base_stat: 79, stat: { name: "defense" } },
            { base_stat: 60, stat: { name: "special-attack" } },
            { base_stat: 100, stat: { name: "special-defense" } },
            { base_stat: 81, stat: { name: "speed" } },
        ],
    },
    {
        id: 384,
        name: "rayquaza",
        types: [{ type: { name: "dragon" } }, { type: { name: "flying" } }],
        stats: [
            { base_stat: 105, stat: { name: "hp" } },
            { base_stat: 150, stat: { name: "attack" } },
            { base_stat: 90, stat: { name: "defense" } },
            { base_stat: 150, stat: { name: "special-attack" } },
            { base_stat: 90, stat: { name: "special-defense" } },
            { base_stat: 95, stat: { name: "speed" } },
        ],
    },
];

export function getFallbackPokemon(nameOrIndex = null) {
    if (!nameOrIndex) {
        return STATIC_POKEMON_LIST[Math.floor(Math.random() * STATIC_POKEMON_LIST.length)];
    }
    if (typeof nameOrIndex === "number") {
        return STATIC_POKEMON_LIST[nameOrIndex % STATIC_POKEMON_LIST.length];
    }
    const match = STATIC_POKEMON_LIST.find((p) => p.name.toLowerCase() === String(nameOrIndex).toLowerCase());
    return match || STATIC_POKEMON_LIST[0];
}

export function getFallbackPair(name1 = null) {
    const p1 = name1 ? getFallbackPokemon(name1) : STATIC_POKEMON_LIST[0];
    const filtered = STATIC_POKEMON_LIST.filter((p) => p.name !== p1.name);
    const p2 = filtered[Math.floor(Math.random() * filtered.length)];
    return [p1, p2];
}