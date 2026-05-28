import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ============ CONSTANTS ============

const COLORS = {
  bg: "#FAF7F2",
  accent: "#4A7C59",
  darkGreen: "#2D5A3D",
  textPrimary: "#2C2C2A",
  textSecondary: "#6B6B68",
  card: "#FFFFFF",
  error: "#D85A30",
  tagBg: "#E8F3EC",
  tagText: "#4A7C59",
  border: "#E8E2D9",
  divider: "#F2EDE4",
  muted: "#9A9A97",
};

// Bump this whenever PRODUCT_CATEGORIES list changes to trigger product-diff flow
const PRODUCTS_VERSION = 2;
const STORAGE_KEY = "eda_bez_truda_state_v2";

const PRODUCT_CATEGORIES = [
  {
    name: "Овощи",
    items: [
      "Помидоры", "Огурцы", "Болгарский перец", "Кабачок/цукини", "Баклажан",
      "Морковь", "Свёкла", "Капуста белокочанная", "Капуста пекинская",
      "Брокколи", "Цветная капуста", "Брюссельская капуста", "Тыква",
      "Картофель", "Батат", "Сельдерей стебель", "Чеснок", "Шпинат", "Руккола",
      "Листовой салат", "Кукуруза", "Стручковая фасоль", "Горошек зелёный",
      "Авокадо", "Редис", "Фенхель",
    ],
  },
  {
    name: "Фрукты",
    items: [
      "Яблоко", "Груша", "Банан", "Апельсин", "Мандарин", "Грейпфрут", "Лимон",
      "Киви", "Манго", "Ананас", "Нектарин/Персик", "Слива", "Хурма", "Гранат",
      "Виноград", "Дыня", "Арбуз",
    ],
  },
  {
    name: "Ягоды",
    items: [
      "Клубника", "Голубика", "Малина", "Ежевика", "Вишня", "Смородина", "Клюква",
    ],
  },
  {
    name: "Зелень",
    items: [
      "Петрушка", "Укроп", "Кинза", "Базилик", "Мята", "Зелёный лук", "Тимьян",
      "Розмарин",
    ],
  },
  {
    name: "Мясо и птица",
    items: [
      "Курица", "Индейка", "Говядина", "Баранина", "Кролик", "Утка", "Субпродукты",
    ],
  },
  {
    name: "Рыба и морепродукты",
    items: [
      "Красная рыба (лосось, форель, кижуч, горбуша)",
      "Белая рыба (треска, минтай)",
      "Дорадо", "Креветки", "Мидии", "Краб (имитация)",
    ],
  },
  {
    name: "Яйца",
    items: ["Яйца"],
  },
  {
    name: "Молочные и кисломолочные",
    items: [
      "Молоко", "Кефир", "Йогурты без добавок", "Йогурты с наполнителем",
      "Греческий йогурт", "Сметана", "Творог", "Сливки",
    ],
  },
  {
    name: "Сыры",
    items: [
      "Полутвёрдые сыры (Пошехонский, Костромской, Ламбер)",
      "Пармезан",
      "Мягкие сыры (Моцарелла, Адыгейский)",
      "Сыры с плесенью (Бри, Камамбер, Дор Блю, Горгонзола)",
    ],
  },
  {
    name: "Крупы и злаки",
    items: [
      "Овсянка", "Гречка", "Рис белый", "Рис бурый", "Перловка", "Пшено",
      "Булгур", "Кускус", "Кукурузная крупа", "Киноа", "Чечевица", "Горох",
      "Фасоль",
    ],
  },
  {
    name: "Бакалея и мучное",
    items: [
      "Макароны", "Хлеб", "Мука", "Сахар", "Томатная паста", "Мёд",
      "Консервы (тунец, шпроты)",
    ],
  },
  {
    name: "Орехи и семена",
    items: [
      "Грецкие орехи", "Миндаль", "Кешью", "Фундук", "Арахис",
      "Тыквенные семечки", "Подсолнечные семечки", "Семена льна",
      "Семена чиа", "Кунжут",
    ],
  },
  {
    name: "Сухофрукты",
    items: [
      "Финики", "Курага", "Чернослив", "Изюм", "Инжир сушёный",
    ],
  },
  {
    name: "Масла",
    items: [
      "Оливковое", "Подсолнечное", "Кокосовое", "Сливочное", "Льняное",
    ],
  },
  {
    name: "Прочее",
    items: [
      "Тёмный шоколад", "Какао-порошок", "Печенье", "Конфеты",
      "Цикорий", "Кофе", "Чай зелёный", "Чай травяной",
    ],
  },
];

// Flatten products with category info
const ALL_PRODUCTS = PRODUCT_CATEGORIES.flatMap((cat) =>
  cat.items.map((item) => ({ name: item, category: cat.name }))
);

// ============ NUTRITION DATABASE ============
// КБЖУ на 100 г указанного состояния. Используется для математического
// подсчёта питательной ценности блюд (не доверяем цифрам ИИ).
const NUTRITION_DB = {
  "Помидоры": { state: "сырые", kcal: 20, protein: 0.9, fat: 0.2, carbs: 3.9 },
  "Огурцы": { state: "сырые", kcal: 15, protein: 0.8, fat: 0.1, carbs: 2.8 },
  "Болгарский перец": { state: "сырой", kcal: 27, protein: 1.3, fat: 0.1, carbs: 5.3 },
  "Кабачок/цукини": { state: "варёный", kcal: 20, protein: 1.2, fat: 0.3, carbs: 3.1 },
  "Баклажан": { state: "тушёный", kcal: 35, protein: 1.0, fat: 0.2, carbs: 6.0 },
  "Морковь": { state: "сырая", kcal: 35, protein: 0.9, fat: 0.2, carbs: 6.9 },
  "Свёкла": { state: "варёная", kcal: 44, protein: 1.7, fat: 0.2, carbs: 9.6 },
  "Капуста белокочанная": { state: "сырая", kcal: 28, protein: 1.8, fat: 0.2, carbs: 4.7 },
  "Капуста пекинская": { state: "сырая", kcal: 16, protein: 1.2, fat: 0.2, carbs: 2.0 },
  "Брокколи": { state: "варёная", kcal: 35, protein: 2.4, fat: 0.4, carbs: 4.0 },
  "Цветная капуста": { state: "варёная", kcal: 29, protein: 1.8, fat: 0.3, carbs: 4.1 },
  "Брюссельская капуста": { state: "варёная", kcal: 43, protein: 3.4, fat: 0.5, carbs: 6.0 },
  "Тыква": { state: "запечённая", kcal: 30, protein: 1.2, fat: 0.3, carbs: 6.5 },
  "Картофель": { state: "варёный", kcal: 82, protein: 2.0, fat: 0.1, carbs: 17.0 },
  "Батат": { state: "запечённый", kcal: 90, protein: 2.0, fat: 0.1, carbs: 20.7 },
  "Сельдерей стебель": { state: "сырой", kcal: 13, protein: 0.9, fat: 0.1, carbs: 2.1 },
  "Чеснок": { state: "сырой", kcal: 143, protein: 6.5, fat: 0.5, carbs: 29.9, note: "используется в малых кол-вах, на КБЖУ влияет мало" },
  "Шпинат": { state: "сырой", kcal: 23, protein: 2.9, fat: 0.3, carbs: 2.0 },
  "Руккола": { state: "сырая", kcal: 25, protein: 2.6, fat: 0.7, carbs: 2.1 },
  "Листовой салат": { state: "сырой", kcal: 15, protein: 1.4, fat: 0.2, carbs: 1.8 },
  "Кукуруза": { state: "варёная", kcal: 96, protein: 3.4, fat: 1.5, carbs: 19.0 },
  "Стручковая фасоль": { state: "варёная", kcal: 35, protein: 1.8, fat: 0.3, carbs: 7.1 },
  "Горошек зелёный": { state: "варёный", kcal: 79, protein: 5.4, fat: 0.4, carbs: 14.5 },
  "Авокадо": { state: "сырое", kcal: 160, protein: 2.0, fat: 14.7, carbs: 2.0 },
  "Редис": { state: "сырой", kcal: 16, protein: 1.2, fat: 0.1, carbs: 3.4 },
  "Фенхель": { state: "сырой", kcal: 31, protein: 1.2, fat: 0.2, carbs: 7.3 },
  "Яблоко": { state: "сырое", kcal: 52, protein: 0.4, fat: 0.2, carbs: 14.0 },
  "Груша": { state: "сырая", kcal: 57, protein: 0.4, fat: 0.3, carbs: 15.0 },
  "Банан": { state: "сырой", kcal: 89, protein: 1.1, fat: 0.3, carbs: 22.8 },
  "Апельсин": { state: "сырой", kcal: 47, protein: 0.9, fat: 0.2, carbs: 11.8 },
  "Мандарин": { state: "сырой", kcal: 53, protein: 0.8, fat: 0.3, carbs: 13.3 },
  "Грейпфрут": { state: "сырой", kcal: 35, protein: 0.7, fat: 0.2, carbs: 8.4 },
  "Лимон": { state: "сырой", kcal: 29, protein: 1.1, fat: 0.3, carbs: 9.3, note: "используется в малых кол-вах" },
  "Киви": { state: "сырое", kcal: 61, protein: 1.1, fat: 0.5, carbs: 14.7 },
  "Манго": { state: "сырое", kcal: 60, protein: 0.8, fat: 0.4, carbs: 15.0 },
  "Ананас": { state: "сырой", kcal: 50, protein: 0.5, fat: 0.1, carbs: 13.1 },
  "Нектарин/Персик": { state: "сырой", kcal: 42, protein: 1.0, fat: 0.3, carbs: 10.0 },
  "Слива": { state: "сырая", kcal: 46, protein: 0.7, fat: 0.3, carbs: 11.4 },
  "Хурма": { state: "сырая", kcal: 66, protein: 0.8, fat: 0.4, carbs: 16.0 },
  "Гранат": { state: "сырой", kcal: 83, protein: 1.7, fat: 1.2, carbs: 18.7 },
  "Виноград": { state: "сырой", kcal: 69, protein: 0.7, fat: 0.2, carbs: 17.0 },
  "Дыня": { state: "сырая", kcal: 33, protein: 0.6, fat: 0.3, carbs: 7.4 },
  "Арбуз": { state: "сырой", kcal: 30, protein: 0.6, fat: 0.2, carbs: 7.6 },
  "Клубника": { state: "сырая", kcal: 33, protein: 0.8, fat: 0.4, carbs: 7.7 },
  "Голубика": { state: "сырая", kcal: 57, protein: 0.7, fat: 0.3, carbs: 14.5 },
  "Малина": { state: "сырая", kcal: 52, protein: 1.2, fat: 0.7, carbs: 11.9 },
  "Ежевика": { state: "сырая", kcal: 43, protein: 1.4, fat: 0.5, carbs: 9.6 },
  "Вишня": { state: "сырая", kcal: 52, protein: 1.1, fat: 0.5, carbs: 10.6 },
  "Смородина": { state: "сырая", kcal: 44, protein: 1.4, fat: 0.4, carbs: 10.0, note: "среднее красной/чёрной" },
  "Клюква": { state: "сырая", kcal: 26, protein: 0.4, fat: 0.1, carbs: 4.8 },
  "Петрушка": { state: "сырая", kcal: 47, protein: 3.7, fat: 0.4, carbs: 7.6 },
  "Укроп": { state: "сырой", kcal: 43, protein: 2.5, fat: 0.5, carbs: 6.3 },
  "Кинза": { state: "сырая", kcal: 23, protein: 2.1, fat: 0.5, carbs: 3.7 },
  "Базилик": { state: "сырой", kcal: 23, protein: 2.5, fat: 0.6, carbs: 2.7 },
  "Мята": { state: "сырая", kcal: 49, protein: 3.7, fat: 0.8, carbs: 8.4 },
  "Зелёный лук": { state: "сырой", kcal: 19, protein: 1.3, fat: 0.1, carbs: 4.6 },
  "Тимьян": { state: "сырой", kcal: 101, protein: 5.6, fat: 1.7, carbs: 24.5, note: "используется в малых кол-вах" },
  "Розмарин": { state: "сырой", kcal: 131, protein: 3.3, fat: 5.9, carbs: 20.7, note: "используется в малых кол-вах" },
  "Курица": { state: "варёная", kcal: 165, protein: 30.0, fat: 3.6, carbs: 0.0, note: "филе без кожи" },
  "Индейка": { state: "варёная", kcal: 135, protein: 29.0, fat: 1.7, carbs: 0.0, note: "филе" },
  "Говядина": { state: "варёная", kcal: 195, protein: 29.0, fat: 8.2, carbs: 0.0, note: "нежирная часть" },
  "Баранина": { state: "варёная", kcal: 230, protein: 28.0, fat: 13.0, carbs: 0.0 },
  "Кролик": { state: "варёный", kcal: 173, protein: 24.6, fat: 7.7, carbs: 0.0 },
  "Утка": { state: "запечённая", kcal: 245, protein: 27.0, fat: 15.0, carbs: 0.0, note: "без кожи" },
  "Субпродукты": { state: "тушёные", kcal: 145, protein: 19.0, fat: 6.0, carbs: 3.0, note: "среднее (печень/сердце/почки)" },
  "Красная рыба (лосось, форель, кижуч, горбуша)": { state: "запечённая", kcal: 200, protein: 22.0, fat: 12.0, carbs: 0.0, note: "усреднение" },
  "Белая рыба (треска, минтай)": { state: "варёная", kcal: 85, protein: 18.0, fat: 0.7, carbs: 0.0, note: "усреднение" },
  "Дорадо": { state: "запечённая", kcal: 96, protein: 19.0, fat: 2.5, carbs: 0.0 },
  "Креветки": { state: "варёные", kcal: 99, protein: 20.5, fat: 1.7, carbs: 0.0 },
  "Мидии": { state: "варёные", kcal: 77, protein: 11.9, fat: 2.0, carbs: 3.7 },
  "Краб (имитация)": { state: "готовый", kcal: 95, protein: 6.0, fat: 1.0, carbs: 15.0, note: "сурими — много углеводов" },
  "Яйца": { state: "варёные", kcal: 157, protein: 12.6, fat: 11.5, carbs: 0.7, note: "1 яйцо C1 ≈ 55 г" },
  "Молоко": { state: "сырое", kcal: 52, protein: 2.9, fat: 2.5, carbs: 4.7, note: "2.5% жирности" },
  "Кефир": { state: "сырой", kcal: 51, protein: 2.9, fat: 2.5, carbs: 4.0, note: "2.5%" },
  "Йогурты без добавок": { state: "сырые", kcal: 60, protein: 3.5, fat: 2.8, carbs: 4.8, note: "натуральный 2.5%" },
  "Йогурты с наполнителем": { state: "сырые", kcal: 90, protein: 3.0, fat: 2.0, carbs: 14.0, note: "питьевой со вкусом" },
  "Греческий йогурт": { state: "сырой", kcal: 73, protein: 5.0, fat: 2.0, carbs: 3.6, note: "2% жирности" },
  "Сметана": { state: "сырая", kcal: 206, protein: 2.8, fat: 20.0, carbs: 3.2, note: "20%" },
  "Творог": { state: "сырой", kcal: 98, protein: 16.0, fat: 1.8, carbs: 3.0, note: "1.8% (нежирный)" },
  "Сливки": { state: "сырые", kcal: 205, protein: 2.7, fat: 20.0, carbs: 3.7, note: "20%" },
  "Полутвёрдые сыры (Пошехонский, Костромской, Ламбер)": { state: "сырые", kcal: 355, protein: 24.0, fat: 29.0, carbs: 0.3 },
  "Пармезан": { state: "сырой", kcal: 392, protein: 33.0, fat: 28.4, carbs: 3.2 },
  "Мягкие сыры (Моцарелла, Адыгейский)": { state: "сырые", kcal: 265, protein: 18.0, fat: 21.0, carbs: 1.5 },
  "Сыры с плесенью (Бри, Камамбер, Дор Блю, Горгонзола)": { state: "сырые", kcal: 340, protein: 20.0, fat: 28.0, carbs: 0.5 },
  "Овсянка": { state: "варёная", kcal: 88, protein: 3.0, fat: 1.7, carbs: 15.0, note: "на воде" },
  "Гречка": { state: "варёная", kcal: 92, protein: 3.4, fat: 0.6, carbs: 20.0 },
  "Рис белый": { state: "варёный", kcal: 116, protein: 2.2, fat: 0.5, carbs: 25.0 },
  "Рис бурый": { state: "варёный", kcal: 110, protein: 2.6, fat: 0.9, carbs: 22.8 },
  "Перловка": { state: "варёная", kcal: 109, protein: 3.1, fat: 0.4, carbs: 22.2 },
  "Пшено": { state: "варёное", kcal: 90, protein: 3.0, fat: 0.7, carbs: 17.0 },
  "Булгур": { state: "варёный", kcal: 83, protein: 3.1, fat: 0.2, carbs: 18.6 },
  "Кускус": { state: "варёный", kcal: 112, protein: 3.8, fat: 0.2, carbs: 23.2 },
  "Кукурузная крупа": { state: "варёная", kcal: 86, protein: 2.0, fat: 0.4, carbs: 19.0 },
  "Киноа": { state: "варёная", kcal: 120, protein: 4.4, fat: 1.9, carbs: 21.3 },
  "Чечевица": { state: "варёная", kcal: 116, protein: 9.0, fat: 0.4, carbs: 20.1 },
  "Горох": { state: "варёный", kcal: 60, protein: 6.0, fat: 0.4, carbs: 9.0 },
  "Фасоль": { state: "варёная", kcal: 127, protein: 8.7, fat: 0.5, carbs: 22.8, note: "усреднение белой/красной" },
  "Макароны": { state: "варёные", kcal: 131, protein: 5.5, fat: 1.1, carbs: 25.0, note: "из твёрдых сортов" },
  "Хлеб": { state: "сухой", kcal: 250, protein: 7.5, fat: 1.0, carbs: 49.0, note: "усреднение бел/чёрн" },
  "Мука": { state: "сухая", kcal: 342, protein: 10.0, fat: 1.1, carbs: 74.0, note: "пшеничная в/с" },
  "Сахар": { state: "сухой", kcal: 399, protein: 0.0, fat: 0.0, carbs: 99.7 },
  "Томатная паста": { state: "готовая", kcal: 82, protein: 4.8, fat: 0.5, carbs: 19.0, note: "используется в малых кол-вах" },
  "Мёд": { state: "сырой", kcal: 329, protein: 0.8, fat: 0.0, carbs: 81.0 },
  "Консервы — тунец": { state: "готовые", kcal: 116, protein: 25.0, fat: 1.0, carbs: 0.0, note: "в собственном соку" },
  "Консервы — шпроты": { state: "готовые", kcal: 363, protein: 17.0, fat: 32.0, carbs: 0.0, note: "в масле" },
  "Грецкие орехи": { state: "сухие", kcal: 654, protein: 15.2, fat: 65.0, carbs: 14.0 },
  "Миндаль": { state: "сухой", kcal: 579, protein: 21.0, fat: 49.9, carbs: 21.7 },
  "Кешью": { state: "сухой", kcal: 553, protein: 18.0, fat: 44.0, carbs: 30.0 },
  "Фундук": { state: "сухой", kcal: 628, protein: 15.0, fat: 61.0, carbs: 16.7 },
  "Арахис": { state: "сухой", kcal: 567, protein: 26.0, fat: 49.2, carbs: 16.1 },
  "Тыквенные семечки": { state: "сухие", kcal: 559, protein: 30.0, fat: 49.0, carbs: 11.0 },
  "Подсолнечные семечки": { state: "сухие", kcal: 584, protein: 21.0, fat: 51.5, carbs: 20.0 },
  "Семена льна": { state: "сухие", kcal: 534, protein: 18.3, fat: 42.2, carbs: 29.0 },
  "Семена чиа": { state: "сухие", kcal: 486, protein: 17.0, fat: 31.0, carbs: 42.0 },
  "Кунжут": { state: "сухой", kcal: 573, protein: 18.0, fat: 49.7, carbs: 23.5 },
  "Финики": { state: "сухие", kcal: 277, protein: 1.8, fat: 0.2, carbs: 75.0 },
  "Курага": { state: "сухая", kcal: 241, protein: 3.4, fat: 0.5, carbs: 62.6 },
  "Чернослив": { state: "сухой", kcal: 240, protein: 2.2, fat: 0.4, carbs: 63.9 },
  "Изюм": { state: "сухой", kcal: 299, protein: 3.1, fat: 0.5, carbs: 79.0 },
  "Инжир сушёный": { state: "сухой", kcal: 249, protein: 3.3, fat: 0.9, carbs: 63.9 },
  "Оливковое": { state: "сырое", kcal: 884, protein: 0.0, fat: 99.8, carbs: 0.0 },
  "Подсолнечное": { state: "сырое", kcal: 899, protein: 0.0, fat: 99.9, carbs: 0.0 },
  "Кокосовое": { state: "сырое", kcal: 899, protein: 0.0, fat: 99.9, carbs: 0.0 },
  "Сливочное": { state: "сырое", kcal: 748, protein: 0.5, fat: 82.5, carbs: 0.8, note: "82.5%" },
  "Льняное": { state: "сырое", kcal: 898, protein: 0.0, fat: 99.8, carbs: 0.0 },
  "Тёмный шоколад": { state: "готовый", kcal: 546, protein: 6.2, fat: 31.0, carbs: 52.0, note: "70%" },
  "Какао-порошок": { state: "сухой", kcal: 289, protein: 24.0, fat: 15.0, carbs: 10.0, note: "используется в малых кол-вах" },
  "Печенье": { state: "готовое", kcal: 417, protein: 7.0, fat: 12.0, carbs: 72.0, note: "овсяное/песочное — усреднение" },
  "Конфеты": { state: "готовые", kcal: 450, protein: 5.0, fat: 18.0, carbs: 68.0, note: "шоколадные/карамель — усреднение" },
  "Цикорий": { state: "готовый", kcal: 0, protein: 0.0, fat: 0.0, carbs: 0.0, note: "растворимый без сахара" },
  "Кофе": { state: "готовый", kcal: 2, protein: 0.1, fat: 0.0, carbs: 0.3, note: "чёрный без сахара" },
  "Чай зелёный": { state: "готовый", kcal: 1, protein: 0.0, fat: 0.0, carbs: 0.0, note: "без сахара" },
  "Чай травяной": { state: "готовый", kcal: 1, protein: 0.0, fat: 0.0, carbs: 0.0, note: "без сахара" },
};

// Сопоставление product.name → данные из NUTRITION_DB.
// В NUTRITION_DB "Консервы" разбиты на тунец и шпроты; в PRODUCT_CATEGORIES
// есть "Консервы (тунец, шпроты)" — маппим его на усреднение по вкусу.
const PRODUCT_NAME_ALIASES = {
  "Консервы (тунец, шпроты)": "Консервы — тунец", // по умолчанию — тунец (менее калорийно)
};

function getNutrition(productName) {
  if (!productName) return null;
  const key = PRODUCT_NAME_ALIASES[productName] || productName;
  return NUTRITION_DB[key] || null;
}

// ============ CALCULATE MEAL NUTRITION ============
// ingredients: [{name: "Курица", grams: 150}, ...]
// Возвращает суммарные КБЖУ + список неизвестных ингредиентов.
function calculateMealNutrition(ingredients) {
  let kcal = 0, protein = 0, fat = 0, carbs = 0;
  const unknown = [];
  for (const ing of (ingredients || [])) {
    const info = getNutrition(ing.name);
    if (!info) { unknown.push(ing.name); continue; }
    const f = (ing.grams || 0) / 100;
    kcal += info.kcal * f;
    protein += info.protein * f;
    fat += info.fat * f;
    carbs += info.carbs * f;
  }
  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    unknown,
  };
}

// ============ GRAM ADJUSTMENT ALGORITHM ============
// Ингредиенты, которые в блюде используются в малых/фиксированных количествах.
// Их граммовки алгоритм НЕ трогает — только то, что дал ИИ.
const FIXED_INGREDIENTS = new Set([
  "Оливковое", "Подсолнечное", "Кокосовое", "Сливочное", "Льняное",
  "Чеснок", "Тимьян", "Розмарин", "Базилик", "Мята", "Петрушка",
  "Укроп", "Кинза", "Зелёный лук", "Лимон",
  "Томатная паста", "Какао-порошок", "Мёд",
  "Кофе", "Чай зелёный", "Чай травяной", "Цикорий",
]);

function classifyIngredient(name) {
  const info = getNutrition(name);
  if (!info) return "unknown";
  if (FIXED_INGREDIENTS.has(name)) return "fixed";
  // Приоритет: если очень жирно (орехи, семена, сыры) — fat
  if (info.fat >= 30) return "fat";
  if (info.protein >= 15) return "protein";
  if (info.carbs >= 15 && info.protein < 10) return "carb";
  if (info.fat >= 15 && info.protein < 15) return "fat";
  return "vegetable";
}

// Контекстные границы граммовок для разных типов приёмов пищи.
function getGramBounds(mealType) {
  const isSnack = mealType === "snack";
  const isBreakfast = mealType === "breakfast";
  const snackFactor = isSnack ? 0.35 : 1;
  return {
    protein:   { min: Math.round(60 * snackFactor),  max: Math.round(250 * snackFactor), step: 5 },
    carb:      { min: Math.round(30 * snackFactor),  max: Math.round(300 * snackFactor), step: 10 },
    fat:       { min: 5,  max: isSnack ? 25 : (isBreakfast ? 35 : 50), step: 2 },
    vegetable: { min: Math.round(50 * snackFactor),  max: Math.round(350 * snackFactor), step: 10 },
  };
}

// Подгоняет граммовки блюда под целевое КБЖУ.
// Возвращает { ingredients: [{name, grams}], nutrition: {kcal,p,f,c,unknown} }.
function adjustMealToTarget(ingredients, target, mealType = "lunch") {
  const BOUNDS = getGramBounds(mealType);

  const items = (ingredients || []).map((ing) => ({
    name: ing.name,
    grams: ing.grams || 100,
    class: classifyIngredient(ing.name),
    originalGrams: ing.grams || 100,
  }));

  const adjustable = items.filter((i) => i.class !== "fixed" && i.class !== "unknown");

  if (adjustable.length === 0) {
    return { ingredients: items.map((i) => ({ name: i.name, grams: i.grams })), nutrition: calculateMealNutrition(items) };
  }

  // Инициализация: пропорциональный масштаб под оставшиеся ккал, с клампом по bounds.
  const fixedNutr = calculateMealNutrition(
    items.filter((i) => i.class === "fixed" || i.class === "unknown").map((i) => ({ name: i.name, grams: i.grams }))
  );
  const startKcal = calculateMealNutrition(
    adjustable.map((i) => ({ name: i.name, grams: i.originalGrams }))
  ).kcal;
  const remainKcal = Math.max(50, target.kcal - fixedNutr.kcal);
  const initScale = startKcal > 0 ? remainKcal / startKcal : 1;
  adjustable.forEach((i) => {
    const b = BOUNDS[i.class];
    const scaled = Math.round(i.originalGrams * initScale);
    i.grams = Math.max(b.min, Math.min(b.max, scaled));
  });

  function loss() {
    const n = calculateMealNutrition(items);
    const kcalDev = (n.kcal - target.kcal) / Math.max(1, target.kcal);
    const pDev = (n.protein - target.protein) / Math.max(1, target.protein);
    const fDev = (n.fat - target.fat) / Math.max(1, target.fat);
    const cDev = (n.carbs - target.carbs) / Math.max(1, target.carbs);
    return 2.5 * kcalDev * kcalDev + 2.0 * pDev * pDev + 2.0 * fDev * fDev + 2.0 * cDev * cDev;
  }

  // Координатный спуск с уменьшающимся шагом.
  const stepMultipliers = [4, 2, 1];
  for (const mult of stepMultipliers) {
    for (let iter = 0; iter < 30; iter++) {
      let improved = false;
      for (const item of adjustable) {
        const b = BOUNDS[item.class];
        const step = b.step * mult;
        const orig = item.grams;
        const baseLoss = loss();
        let bestGrams = orig;
        let bestLoss = baseLoss;
        if (orig + step <= b.max) {
          item.grams = orig + step;
          const l = loss();
          if (l < bestLoss) { bestLoss = l; bestGrams = item.grams; }
        }
        if (orig - step >= b.min) {
          item.grams = orig - step;
          const l = loss();
          if (l < bestLoss) { bestLoss = l; bestGrams = item.grams; }
        }
        item.grams = bestGrams;
        if (bestGrams !== orig) improved = true;
      }
      if (!improved) break;
    }
  }

  return {
    ingredients: items.map((i) => ({ name: i.name, grams: i.grams })),
    nutrition: calculateMealNutrition(items),
  };
}

// ============ DAILY TARGETS DISTRIBUTION ============
// Распределяет дневную норму КБЖУ по приёмам пищи.
// По умолчанию: завтрак 25%, обед 35%, ужин 30%, перекус 10%.
function distributeDailyTargets(dailyKbju) {
  if (!dailyKbju) return null;
  const kcal = dailyKbju.protein * 4 + dailyKbju.carbs * 4 + dailyKbju.fat * 9;
  const split = { breakfast: 0.25, lunch: 0.35, dinner: 0.30, snack: 0.10 };
  const out = {};
  for (const [meal, ratio] of Object.entries(split)) {
    out[meal] = {
      kcal: Math.round(kcal * ratio),
      protein: Math.round(dailyKbju.protein * ratio),
      fat: Math.round(dailyKbju.fat * ratio),
      carbs: Math.round(dailyKbju.carbs * ratio),
    };
  }
  return out;
}

// Насколько блюдо "вписалось" в норму. Возвращает максимальное отклонение в % по любому из макронутриентов.
// Используется чтобы показывать ⚠️, если > 15%.
function maxDeviation(nutrition, target) {
  if (!target) return 0;
  const devs = [
    Math.abs(nutrition.kcal - target.kcal) / Math.max(1, target.kcal),
    Math.abs(nutrition.protein - target.protein) / Math.max(1, target.protein),
    Math.abs(nutrition.fat - target.fat) / Math.max(1, target.fat),
    Math.abs(nutrition.carbs - target.carbs) / Math.max(1, target.carbs),
  ];
  return Math.max(...devs);
}


const MONTH_NAMES = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];

// ============ UTILITIES ============

function buildMenuPrompt(regularProducts, occasionalProducts, goal, kbju) {
  const currentMonth = MONTH_NAMES[new Date().getMonth()];
  const goalText = goal === "weight"
    ? "работать с весом по своим цифрам КБЖУ"
    : "получить больше энергии и бодрости за счёт продуктов, богатых железом, B12, фолиевой кислотой и витамином C";

  // Советы по жирам: если цель по жирам высокая, явно просим ИИ
  // добавить жиросодержащие ингредиенты.
  let fatGuidance = "";
  if (goal === "weight" && kbju) {
    const fatShare = kbju.fat / (kbju.protein + kbju.fat + kbju.carbs);
    if (fatShare >= 0.25) {
      fatGuidance = `\nОсобое внимание ЖИРАМ: цель по жирам высокая (${kbju.fat}г). В каждое блюдо включай источник жиров — оливковое/льняное масло (10–15г), орехи (15–25г), семена (10г), авокадо, сыр, жирную рыбу. Не полагайся только на постную курицу + кашу — так жир не набрать.\n`;
    }
  }

  let prompt = `Составь меню на 7 дней (Понедельник–Воскресенье) для человека, который хочет ${goalText}.

Продукты которые человек ест РЕГУЛЯРНО (несколько раз в неделю):
${regularProducts.join(", ")}

Продукты которые человек ест РЕДКО (1-2 раза в две недели):
${occasionalProducts.join(", ")}

`;

  if (goal === "weight" && kbju) {
    prompt += `Цель по КБЖУ в сутки: Белки — ${kbju.protein}г, Жиры — ${kbju.fat}г, Углеводы — ${kbju.carbs}г.
${fatGuidance}
Обязательные правила:
1. Суммарно за день БЖУ должен быть близок к цели. Программа сама подгонит граммовки — твоя задача предложить СБАЛАНСИРОВАННЫЕ БЛЮДА с правильным СОСТАВОМ.
2. В рамках недели блюда не повторяются.
3. Используй максимально разнообразно все продукты из списков. Регулярные продукты используй чаще (3–5 раз за неделю), редкие — не более 1–2 раз за неделю.
4. Не пиши просто набор продуктов — предлагай полноценные блюда с названием. К основному блюду всегда добавляй дополнение: салат, ягоды, семена, соус и т.п.
5. Завтраки по будням — простые и быстрые (овсянка, творог, яйца: омлет или глазунья). В выходные (Сб, Вс) завтрак может быть сложнее: сырники, запеканка, тосты с яйцом, блины.
6. Чередуй каши: чаще овсяная, но включай ячневую, кукурузную, пшённую если они есть в списке продуктов человека.
7. На обед и ужин: гарнир + белок (мясо/рыба) + овощи. Можно готовить всё вместе (тушёное, запечённое) или по отдельности. Овощи обязательны на обед и ужин — используй всё многообразие, не только огурцы и помидоры.
8. Учитывай сезонность. Сейчас ${currentMonth}. Предлагай сезонные овощи и фрукты.
9. Используй ТОЛЬКО те продукты, которые есть в списках пользователя. Не добавляй другие.

`;
  } else {
    prompt += `Цель: меню с акцентом на продукты богатые железом, витамином C, B12 и фолиевой кислотой. Приоритет отдавай: печени (если есть в списке), говядине, шпинату, бобовым, рыбе, яйцам, цитрусовым, ягодам, зелени.

Обязательные правила:
1. В рамках недели блюда не повторяются.
2. Используй максимально разнообразно все продукты из списков. Регулярные продукты используй чаще (3–5 раз за неделю), редкие — не более 1–2 раз за неделю.
3. Не пиши просто набор продуктов — предлагай полноценные блюда с названием. К основному блюду всегда добавляй дополнение: салат, ягоды, семена, соус и т.п.
4. Завтраки по будням — простые и быстрые (овсянка, творог, яйца: омлет или глазунья). В выходные (Сб, Вс) завтрак может быть сложнее: сырники, запеканка, тосты с яйцом, блины.
5. Чередуй каши: чаще овсяная, но включай ячневую, кукурузную, пшённую если они есть в списке продуктов человека.
6. На обед и ужин: гарнир + белок (мясо/рыба) + овощи. Можно готовить всё вместе (тушёное, запечённое) или по отдельности. Овощи обязательны на обед и ужин — используй всё многообразие, не только огурцы и помидоры.
7. Учитывай сезонность. Сейчас ${currentMonth}. Предлагай сезонные овощи и фрукты.
8. Используй ТОЛЬКО те продукты, которые есть в списках пользователя. Не добавляй другие.

`;
  }

  // Список продуктов, которые есть в NUTRITION_DB — чтобы ИИ использовал только эти названия
  const availableNames = [...regularProducts, ...occasionalProducts];

  prompt += `КРИТИЧЕСКИ ВАЖНО — формат ингредиентов:
- Поле "ingredients" — массив объектов {"name": "Курица", "grams": 150}, где name — это ТОЧНО ОДНО из названий в списках продуктов выше (НЕ "курица варёная", не "куриное филе", а "Курица"; не "Помидор", а "Помидоры" — точное совпадение).
- grams — примерная стартовая граммовка готового блюда (программа сама её подкрутит под цели КБЖУ).
- Типичные граммовки: мясо/рыба 100–180г, крупа варёная 80–180г, овощи 80–200г, масло 5–15г, орехи 10–25г, йогурт/творог 100–200г.
- 4–7 ингредиентов на блюдо.
- НЕ указывай КБЖУ, ккал, белки, жиры, углеводы — программа их сама посчитает.

Поле "description" — короткое пояснение блюда на русском (до 12 слов).

Верни ответ СТРОГО в формате JSON без какого-либо текста до или после. Обязательно закрой все скобки.

{
  "week": [
    {
      "day": "Понедельник",
      "breakfast": { "name": "...", "description": "...", "ingredients": [{"name": "Овсянка", "grams": 150}, {"name": "Банан", "grams": 80}] },
      "lunch": { "name": "...", "description": "...", "ingredients": [{"name": "Курица", "grams": 150}, {"name": "Гречка", "grams": 150}, {"name": "Брокколи", "grams": 120}, {"name": "Оливковое", "grams": 10}] },
      "dinner": { "name": "...", "description": "...", "ingredients": [{"name": "...", "grams": 0}] },
      "snack": { "name": "...", "description": "...", "ingredients": [{"name": "...", "grams": 0}] }
    }
  ],
  "shopping_list": ["продукт 1", "продукт 2"]
}

Напоминание: названия в ingredients.name должны быть ИДЕНТИЧНЫ названиям в списках продуктов пользователя. Примеры корректных имён: "${availableNames.slice(0, 8).join('", "')}".`;

  return prompt;
}

// Build a prompt to generate a detailed recipe for a single dish.
// Теперь ingredients у meal — это [{name, grams}] с УЖЕ ПОДОГНАННЫМИ граммовками,
// и эти граммовки мы показываем пользователю отдельно. В сам рецепт ИИ пишет
// ПРОЦЕСС приготовления без повторения граммовок.
function buildRecipePrompt(meal) {
  const ingredientsText = (meal.ingredients || [])
    .map((i) => typeof i === "string" ? i : `${i.name}${i.grams ? " (" + i.grams + "г)" : ""}`)
    .join(", ");
  return `Составь рецепт приготовления блюда: "${meal.name}".

Краткое описание: ${meal.description || "—"}
Ингредиенты (граммовки уже рассчитаны, их НЕ повторяй в рецепте): ${ingredientsText || "на твоё усмотрение"}

Стиль: простая домашняя европейская кухня (варёное, тушёное, запечённое). Время приготовления 20–45 минут. Техника доступная: плита, духовка, сковорода, кастрюля. Без экзотических техник.

Верни ответ СТРОГО в JSON-формате без текста до или после:
{
  "time_minutes": 30,
  "difficulty": "легко",
  "steps": [
    "Вскипяти воду и посоли.",
    "Засыпь крупу, вари 15 минут."
  ],
  "tips": "Можно заменить молоко на кефир."
}

Правила:
- "difficulty" — одно из: "легко", "средне", "сложно"
- "time_minutes" — суммарное время в минутах, целое число от 20 до 45
- "steps" — массив из 4–7 шагов. КАЖДЫЙ ШАГ — одно короткое действие БЕЗ упоминания граммовок и количеств (граммовки пользователь видит отдельно). Пиши императивно: "Разогрей духовку", "Посоли курицу", "Нарежь овощи".
- "tips" — одна короткая заметка или пустая строка
- Все тексты на русском языке`;
}

// === EMOJI FOR MEALS ===
// Вместо картинок из интернета (Unsplash Source API закрыт с 2024 г.)
// используем эмодзи — надёжно, без внешних зависимостей.
// Порядок правил важен: более специфичные слова идут раньше общих.
const MEAL_EMOJI_RULES = [
  // Завтраки
  ["овсянк|овсян|каш", "🥣"],
  ["творог|сырник|запеканк", "🧀"],
  ["омлет|яичниц|яйц|глазун", "🍳"],
  ["блин|панкейк|панкек", "🥞"],
  ["тост|бутерброд|сэндвич", "🥪"],
  ["йогурт|кефир", "🥛"],
  // Супы
  ["борщ|щи|суп-пюре|суп|шурпа|гуляш|бульон", "🍲"],
  // Мясо и птица
  ["котлет|биточ|тефтел", "🍖"],
  ["курин|курица|индейк|крыл|голен|филе птиц", "🍗"],
  ["говядин|стейк|бифштекс|ростбиф|телятин|баранин|свинин|ребр", "🥩"],
  // Рыба и морепродукты
  ["лосос|сёмг|семг|форел|кижуч|горбуш|треск|минта|дорадо|рыб", "🐟"],
  ["креветк|мидии|кальмар|краб|морепрод", "🦐"],
  // Гарниры
  ["гречк|перловк|пшено|булгур|киноа|кускус|кукуруз", "🌾"],
  ["рис|плов|ризотто", "🍚"],
  ["паст|макарон|спагетти|лазан|равиол", "🍝"],
  ["картоф|батат|карт пюре|пюре|драник", "🥔"],
  // Овощи и салаты
  ["салат|цезар|греческ салат|винегр", "🥗"],
  ["брокколи|цветная капуст|брюссельск", "🥦"],
  ["помидор|томат", "🍅"],
  ["морков", "🥕"],
  ["чечевиц|фасол|горох|нут|бобов", "🫘"],
  ["авокадо|гуакамоле", "🥑"],
  ["тыкв", "🎃"],
  ["перец|паприк", "🫑"],
  ["огурц|огурец", "🥒"],
  ["баклажан", "🍆"],
  ["шпинат|руккол|листов|зелен", "🌿"],
  // Фрукты и ягоды
  ["яблок", "🍎"],
  ["банан", "🍌"],
  ["клубник|малин|голубик|ежевик|ягод|вишн|смородин|клюкв", "🫐"],
  ["апельсин|мандарин|цитрус", "🍊"],
  ["груш", "🍐"],
  ["персик|нектарин", "🍑"],
  ["виноград", "🍇"],
  // Орехи, семена
  ["орех|миндал|кешью|фундук|арахис|семеч|чиа|лён|льн|кунжут", "🌰"],
  // Сыр
  ["сыр|моцарел|пармезан|брынз|фет", "🧀"],
  // Напитки
  ["кофе", "☕"],
  ["чай", "🍵"],
  // Десерты, прочее
  ["шоколад|конфет|печень|десерт", "🍫"],
  ["хлеб|булочк|лепёшк", "🍞"],
];

// Возвращает эмодзи, подходящий блюду (по названию и/или ингредиентам).
// Имя функции оставлено как guessImageQuery для обратной совместимости.
function guessImageQuery(name, ingredients) {
  const haystack = [
    (name || "").toLowerCase(),
    ...((ingredients || []).map((i) => (typeof i === "string" ? i : i?.name || "").toLowerCase())),
  ].join(" ");
  for (const [pattern, emoji] of MEAL_EMOJI_RULES) {
    const re = new RegExp(pattern, "i");
    if (re.test(haystack)) return emoji;
  }
  return "🍽️";
}

// Сохранили старое имя как шим — уже не используется, но не ломает код.
function imageUrlFromQuery() { return null; }


// Recipe cache — keyed by meal name. Lives in storage + memory for session.
const RECIPE_CACHE_KEY = "eda_recipe_cache_v2";
let _recipeCacheLoaded = null;
let _recipeCache = {};

async function loadRecipeCache() {
  if (_recipeCacheLoaded) return _recipeCache;
  const saved = await storageGet(RECIPE_CACHE_KEY);
  _recipeCache = saved && typeof saved === "object" ? saved : {};
  _recipeCacheLoaded = true;
  return _recipeCache;
}

async function saveRecipeToCache(key, recipe) {
  await loadRecipeCache();
  _recipeCache[key] = recipe;
  await storageSet(RECIPE_CACHE_KEY, _recipeCache);
}

function getRecipeFromCache(key) {
  return _recipeCache[key] || null;
}

// Try to repair truncated JSON (response was cut off mid-way by max_tokens).
// Walks the string, tracks open brackets and unterminated strings, then
// closes them. Returns null if unrecoverable.
function repairTruncatedJson(raw) {
  if (!raw) return null;
  let s = raw.trim();
  // Strip markdown fences if any survived
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  // Find first '{' or '['
  const firstBrace = s.indexOf("{");
  const firstBracket = s.indexOf("[");
  const start =
    firstBrace === -1 ? firstBracket : firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket);
  if (start < 0) return null;
  s = s.slice(start);

  const stack = [];
  let inString = false;
  let escape = false;
  let lastGoodIdx = -1;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{" || ch === "[") {
      stack.push(ch);
    } else if (ch === "}" || ch === "]") {
      stack.pop();
      // Mark the position where stack becomes stable
      if (stack.length === 0) lastGoodIdx = i;
    }
  }

  // Strategy 1: try as-is
  try {
    return JSON.parse(s);
  } catch (e) {}

  // Strategy 2: truncate to last fully-closed bracket
  if (lastGoodIdx >= 0) {
    try {
      return JSON.parse(s.slice(0, lastGoodIdx + 1));
    } catch (e) {}
  }

  // Strategy 3: close unterminated string + remaining brackets, drop trailing commas
  let fixed = s;
  if (inString) fixed += '"';
  // Remove trailing incomplete key-value (e.g., "descri) by cutting to last comma or brace
  // then close stack
  const closers = stack.reverse().map((c) => (c === "{" ? "}" : "]")).join("");
  // Try to walk back to a safe stop: last comma or colon that was outside a string
  // Then remove anything after it, and close stack
  for (let attempt = 0; attempt < 5; attempt++) {
    // Try closing with current stack
    let candidate = fixed.replace(/,\s*$/, "") + closers;
    try {
      return JSON.parse(candidate);
    } catch (e) {}
    // Walk back to previous comma outside string
    const lastComma = findLastSafeBreak(fixed);
    if (lastComma <= 0) break;
    fixed = fixed.slice(0, lastComma);
  }

  return null;
}

function findLastSafeBreak(s) {
  let inString = false;
  let escape = false;
  let lastBreak = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "," || ch === "}" || ch === "]") {
      lastBreak = i;
    }
  }
  return lastBreak;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 640 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

// ============ STORAGE LAYER ============
// Tries localStorage first (works on deployed sites), then falls back to
// window.storage (works in Claude.ai artifacts), then in-memory (last resort).

const memoryStore = {};

async function storageGet(key) {
  // Try localStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    }
  } catch (e) {
    // localStorage blocked or unavailable
  }
  // Try window.storage
  try {
    if (typeof window !== "undefined" && window.storage && window.storage.get) {
      const res = await window.storage.get(key);
      if (res && res.value !== undefined) {
        return typeof res.value === "string" ? JSON.parse(res.value) : res.value;
      }
    }
  } catch (e) {
    // window.storage threw — key likely doesn't exist, treat as null
  }
  // Fallback
  return memoryStore[key] !== undefined ? memoryStore[key] : null;
}

async function storageSet(key, value) {
  memoryStore[key] = value;
  let saved = false;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
      saved = true;
    }
  } catch (e) {}
  if (!saved) {
    try {
      if (typeof window !== "undefined" && window.storage && window.storage.set) {
        await window.storage.set(key, JSON.stringify(value));
      }
    } catch (e) {}
  }
}

async function storageDelete(key) {
  delete memoryStore[key];
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (e) {}
  try {
    if (typeof window !== "undefined" && window.storage && window.storage.delete) {
      await window.storage.delete(key);
    }
  } catch (e) {}
}

// Soft migration: given saved eaten/regular/occasional lists and the current
// product universe, compute which products are NEW (weren't in saved version).
// Returns { reconciled: {eaten, regular, occasional}, newProducts: [...] }.
function reconcileProducts(saved, currentAllProducts) {
  const allNames = new Set(currentAllProducts.map((p) => p.name));
  const filter = (arr) =>
    (arr || [])
      .filter((p) => allNames.has(p.name || p))
      .map((p) => (typeof p === "string" ? { name: p, category: lookupCategory(p, currentAllProducts) } : p));

  const eaten = filter(saved.eatenProducts);
  const regular = filter(saved.regularProducts);
  const occasional = filter(saved.occasionalProducts);

  // Find products in current list that weren't in saved eaten OR rejected
  // Saved "rejected" = everything in saved state that wasn't in eatenProducts.
  // We only have eaten (right-swipes) saved. Anything absent from saved version entirely → new.
  const knownNames = new Set();
  (saved.allKnownProducts || []).forEach((n) => knownNames.add(n));
  // Fallback if allKnownProducts missing (old save): assume anything not in eaten was rejected
  if (!saved.allKnownProducts) {
    (saved.eatenProducts || []).forEach((p) => knownNames.add(p.name || p));
    (saved.rejectedProducts || []).forEach((p) => knownNames.add(p.name || p));
  }

  const newProducts = currentAllProducts.filter((p) => !knownNames.has(p.name));

  return {
    reconciled: { eaten, regular, occasional },
    newProducts,
  };
}

function lookupCategory(name, products) {
  const found = products.find((p) => p.name === name);
  return found ? found.category : "Прочее";
}

// ============ GLOBAL STYLES ============

function GlobalStyles() {
  return (
    <style>{`
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes pulse {
        0%, 100% { box-shadow: 0 4px 16px rgba(74,124,89,0.25); }
        50% { box-shadow: 0 4px 24px rgba(74,124,89,0.5); }
      }
      @keyframes cardEnter {
        from { opacity: 0; transform: scale(0.92); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes loadingFill {
        from { width: 0%; }
        to { width: 100%; }
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif;
        background: ${COLORS.bg};
        color: ${COLORS.textPrimary};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      button {
        font-family: inherit;
        cursor: pointer;
        transition: transform 150ms ease, background 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
      }
      button:hover:not(:disabled) { transform: scale(1.02); }
      button:active:not(:disabled) { transform: scale(0.98); }
      button:disabled { cursor: not-allowed; opacity: 0.5; }
      input {
        font-family: inherit;
        outline: none;
      }
      input::placeholder { color: ${COLORS.muted}; }
      .fade-in-up { animation: fadeInUp 400ms ease forwards; }
      .fade-in { animation: fadeIn 400ms ease forwards; }
      .day-pill-scroll::-webkit-scrollbar { height: 0; }
      .day-pill-scroll { scrollbar-width: none; }
      .card-shadow { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
      .big-card-shadow { box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
    `}</style>
  );
}

// ============ SHARED COMPONENTS ============

function TagPill({ children, style }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: COLORS.tagBg,
        color: COLORS.tagText,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        padding: "6px 12px",
        borderRadius: 20,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function ProgressBar({ value, total }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div style={{ width: "100%", marginBottom: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 6,
            background: COLORS.border,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: COLORS.accent,
              borderRadius: 3,
              transition: "width 400ms ease",
            }}
          />
        </div>
        <span style={{ fontSize: 13, color: COLORS.textSecondary, minWidth: 64, textAlign: "right" }}>
          {value} / {total}
        </span>
      </div>
    </div>
  );
}

function GreenButton({ children, onClick, disabled, style, pulsing }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: COLORS.accent,
        color: "#fff",
        border: "none",
        borderRadius: 28,
        padding: "14px 32px",
        fontSize: 16,
        fontWeight: 700,
        boxShadow: "0 4px 16px rgba(74,124,89,0.25)",
        animation: pulsing ? "pulse 2s ease-in-out infinite" : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        color: COLORS.accent,
        border: `1.5px solid ${COLORS.accent}`,
        borderRadius: 28,
        padding: "12px 24px",
        fontSize: 15,
        fontWeight: 700,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ============ SCREEN 0 — WELCOME ============

function WelcomeScreen({ onStart, isMobile, onDevSkip }) {
  const [showLine2, setShowLine2] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowLine2(true), 800);
    const t2 = setTimeout(() => setShowButton(true), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
        <div className="fade-in" style={{ marginBottom: 28, animationDuration: "600ms" }}>
          <TagPill>Шаг 1</TagPill>
        </div>
        <div
          className="fade-in"
          style={{
            fontSize: 24,
            fontWeight: 500,
            color: COLORS.textPrimary,
            lineHeight: 1.6,
            marginBottom: 16,
            animationDuration: "600ms",
          }}
        >
          Привет! Начнём? 👋
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 500,
            color: COLORS.textPrimary,
            lineHeight: 1.6,
            marginBottom: 32,
            opacity: showLine2 ? 1 : 0,
            transform: showLine2 ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 600ms ease, transform 600ms ease",
          }}
        >
          Свайпай вправо — если ешь этот продукт, влево — если не ешь.
        </div>
        <div
          style={{
            fontSize: 14,
            color: COLORS.textSecondary,
            marginBottom: 40,
            opacity: showLine2 ? 1 : 0,
            transition: "opacity 600ms ease 200ms",
          }}
        >
          {isMobile ? "Свайпай карточку пальцем" : "Используй кнопки ← → или клавиши со стрелками"}
        </div>
        <div
          style={{
            opacity: showButton ? 1 : 0,
            transform: showButton ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 600ms ease, transform 600ms ease",
          }}
        >
          <GreenButton onClick={onStart} style={{ padding: "16px 48px", fontSize: 17 }}>
            Начать
          </GreenButton>
        </div>

        {/* DEV-ONLY: skip onboarding with fake data */}
        {onDevSkip && (
          <div
            style={{
              marginTop: 32,
              opacity: showButton ? 0.5 : 0,
              transition: "opacity 600ms ease 400ms",
            }}
          >
            <button
              onClick={onDevSkip}
              style={{
                background: "transparent",
                border: `1px dashed ${COLORS.muted}`,
                borderRadius: 16,
                padding: "8px 16px",
                fontSize: 12,
                color: COLORS.muted,
                cursor: "pointer",
                fontFamily: "monospace",
              }}
            >
              🛠 dev: заполнить продукты и пропустить к цели
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ SWIPE CARD COMPONENT ============

function SwipeCard({
  product,
  categoryLabel,
  onSwipeLeft,
  onSwipeRight,
  leftLabel,
  rightLabel,
  isMobile,
  progressCount,
  progressTotal,
  motivationalMsg,
  tagText,
  mode = "step1", // "step1" = red ✕ / green ✓; "step2" = both green ✓ / ✓✓
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false });
  const [exitState, setExitState] = useState(null); // null | 'left' | 'right'
  const [tintColor, setTintColor] = useState(null);
  const cardRef = useRef(null);
  const startRef = useRef({ x: 0, y: 0 });

  // Reset when product changes
  useEffect(() => {
    setDrag({ x: 0, y: 0, dragging: false });
    setExitState(null);
    setTintColor(null);
  }, [product]);

  const leftColor = mode === "step2" ? COLORS.accent : COLORS.error;
  const leftTint = mode === "step2" ? "rgba(74,124,89,0.10)" : "rgba(216,90,48,0.18)";
  const rightTint = "rgba(74,124,89,0.18)";

  const handleSwipe = useCallback(
    (dir) => {
      if (exitState) return;
      setExitState(dir);
      setTintColor(dir === "right" ? rightTint : leftTint);
      setTimeout(() => {
        if (dir === "right") onSwipeRight();
        else onSwipeLeft();
      }, 280);
    },
    [exitState, onSwipeLeft, onSwipeRight, leftTint, rightTint]
  );

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") handleSwipe("left");
      else if (e.key === "ArrowRight") handleSwipe("right");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSwipe]);

  // Touch handlers
  const onTouchStart = (e) => {
    if (exitState) return;
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
    setDrag({ x: 0, y: 0, dragging: true });
  };
  const onTouchMove = (e) => {
    if (!drag.dragging || exitState) return;
    const t = e.touches[0];
    const dx = t.clientX - startRef.current.x;
    const dy = t.clientY - startRef.current.y;
    setDrag({ x: dx, y: dy, dragging: true });
  };
  const onTouchEnd = () => {
    if (!drag.dragging || exitState) return;
    const threshold = 50;
    if (drag.x > threshold) handleSwipe("right");
    else if (drag.x < -threshold) handleSwipe("left");
    else setDrag({ x: 0, y: 0, dragging: false });
  };

  // Compute transforms
  let transform = "";
  let transition = "transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 280ms ease-in";
  let opacity = 1;

  if (exitState === "left") {
    transform = "translateX(-120%) rotate(-8deg)";
    opacity = 0;
    transition = "transform 280ms ease-in, opacity 280ms ease-in";
  } else if (exitState === "right") {
    transform = "translateX(120%) rotate(8deg)";
    opacity = 0;
    transition = "transform 280ms ease-in, opacity 280ms ease-in";
  } else if (drag.dragging) {
    const rot = drag.x / 8;
    transform = `translateX(${drag.x}px) translateY(${drag.y * 0.3}px) rotate(${rot}deg)`;
    transition = "none";
  } else {
    transform = "translateX(0) rotate(0deg)";
  }

  const cardWidth = isMobile ? 260 : 280;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        padding: "0 16px",
      }}
    >
      {/* Top area: tag + progress */}
      <div style={{ width: "100%", maxWidth: 520, marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <TagPill>{tagText}</TagPill>
        </div>
        <ProgressBar value={progressCount} total={progressTotal} />
      </div>

      {/* Motivational message area - fixed height */}
      <div
        style={{
          height: 28,
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {motivationalMsg && (
          <div
            key={motivationalMsg}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.accent,
              animation: "fadeIn 300ms ease",
              textAlign: "center",
            }}
          >
            {motivationalMsg}
          </div>
        )}
      </div>

      {/* Category label */}
      <div
        style={{
          fontSize: 13,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: COLORS.muted,
          marginBottom: 24,
          textAlign: "center",
          fontWeight: 600,
        }}
      >
        {categoryLabel}
      </div>

      {/* Card + side buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 0 : 28,
          justifyContent: "center",
          width: "100%",
        }}
      >
        {!isMobile && (
          <button
            onClick={() => handleSwipe("left")}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              border: `2px solid ${leftColor}`,
              background: "transparent",
              color: leftColor,
              fontSize: mode === "step2" ? 22 : 24,
              fontWeight: 700,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            aria-label={leftLabel || "Не ем"}
          >
            {mode === "step2" ? "✓" : "✕"}
          </button>
        )}

        <div style={{ position: "relative", width: cardWidth, height: 360 }}>
          {/* Card */}
          <div
            ref={cardRef}
            onTouchStart={isMobile ? onTouchStart : undefined}
            onTouchMove={isMobile ? onTouchMove : undefined}
            onTouchEnd={isMobile ? onTouchEnd : undefined}
            style={{
              position: "absolute",
              inset: 0,
              background: COLORS.card,
              borderRadius: 24,
              padding: "40px 32px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform,
              transition,
              opacity,
              willChange: "transform, opacity",
              touchAction: "pan-y",
              userSelect: "none",
              animation: !exitState && !drag.dragging ? "cardEnter 300ms ease-out" : undefined,
              overflow: "hidden",
            }}
            key={product}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: COLORS.textPrimary,
                textAlign: "center",
                lineHeight: 1.3,
                zIndex: 1,
              }}
            >
              {product}
            </div>
            {/* Tint overlay */}
            {tintColor && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: tintColor,
                  borderRadius: 24,
                  pointerEvents: "none",
                  animation: "fadeIn 200ms ease",
                }}
              />
            )}
            {/* Drag indicators */}
            {drag.dragging && drag.x > 30 && (
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  border: `3px solid ${COLORS.accent}`,
                  color: COLORS.accent,
                  fontSize: 18,
                  fontWeight: 800,
                  padding: "6px 14px",
                  borderRadius: 10,
                  transform: "rotate(15deg)",
                  opacity: Math.min(drag.x / 80, 1),
                  letterSpacing: mode === "step2" ? -1 : 0,
                }}
              >
                {mode === "step2" ? "✓✓" : "✓"}
              </div>
            )}
            {drag.dragging && drag.x < -30 && (
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  left: 20,
                  border: `3px solid ${leftColor}`,
                  color: leftColor,
                  fontSize: 18,
                  fontWeight: 800,
                  padding: "6px 14px",
                  borderRadius: 10,
                  transform: "rotate(-15deg)",
                  opacity: Math.min(-drag.x / 80, 1),
                }}
              >
                {mode === "step2" ? "✓" : "✕"}
              </div>
            )}
          </div>
        </div>

        {!isMobile && (
          <button
            onClick={() => handleSwipe("right")}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              border: `2px solid ${COLORS.accent}`,
              background: "transparent",
              color: COLORS.accent,
              fontSize: mode === "step2" ? 18 : 24,
              fontWeight: 700,
              flexShrink: 0,
              letterSpacing: mode === "step2" ? -2 : 0,
            }}
            aria-label={rightLabel || "Ем"}
          >
            {mode === "step2" ? "✓✓" : "✓"}
          </button>
        )}
      </div>

      {/* Mobile buttons */}
      {isMobile && (
        <div
          style={{
            display: "flex",
            gap: 40,
            marginTop: 28,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => handleSwipe("left")}
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: `2px solid ${leftColor}`,
                background: "transparent",
                color: leftColor,
                fontSize: mode === "step2" ? 24 : 26,
                fontWeight: 700,
              }}
            >
              {mode === "step2" ? "✓" : "✕"}
            </button>
            {leftLabel && (
              <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>
                {leftLabel}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => handleSwipe("right")}
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: `2px solid ${COLORS.accent}`,
                background: "transparent",
                color: COLORS.accent,
                fontSize: mode === "step2" ? 20 : 26,
                fontWeight: 700,
                letterSpacing: mode === "step2" ? -2 : 0,
              }}
            >
              {mode === "step2" ? "✓✓" : "✓"}
            </button>
            {rightLabel && (
              <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>
                {rightLabel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Desktop labels under buttons for step 2 */}
      {!isMobile && (leftLabel || rightLabel) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: cardWidth + 2 * (52 + 28),
            marginTop: 14,
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600, width: 52, textAlign: "center" }}>
            {leftLabel}
          </span>
          <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600, width: 52, textAlign: "center" }}>
            {rightLabel}
          </span>
        </div>
      )}
    </div>
  );
}

// ============ MOTIVATIONAL MSG LOGIC ============

function useMotivationalMsg(pct) {
  const [msg, setMsg] = useState(null);
  const shownRef = useRef(new Set());

  useEffect(() => {
    const milestones = [
      { threshold: 30, text: "Отлично! Продолжай так же! 🌿" },
      { threshold: 50, text: "Огонь, полпути пройдено! 🔥" },
      { threshold: 70, text: "Осталось совсем чуть-чуть! 💪" },
      { threshold: 100, text: "Шикарно! У тебя получилось! 🎉" },
    ];
    for (const m of milestones) {
      if (pct >= m.threshold && !shownRef.current.has(m.threshold)) {
        shownRef.current.add(m.threshold);
        setMsg(m.text);
        const t = setTimeout(() => setMsg(null), 2300);
        return () => clearTimeout(t);
      }
    }
  }, [pct]);

  return msg;
}

// ============ SCREEN 1 — STEP 1 SORTING ============

function Step1Screen({ onComplete, isMobile }) {
  const [index, setIndex] = useState(0);
  const [eaten, setEaten] = useState([]);
  const total = ALL_PRODUCTS.length;
  const pct = (index / total) * 100;
  const motivationalMsg = useMotivationalMsg(pct);

  const current = ALL_PRODUCTS[index];

  const handleRight = () => {
    const newEaten = [...eaten, current];
    setEaten(newEaten);
    advance(newEaten);
  };

  const handleLeft = () => {
    advance(eaten);
  };

  const advance = (latestEaten) => {
    if (index + 1 >= total) {
      setIndex(index + 1);
      setTimeout(() => onComplete(latestEaten), 600);
    } else {
      setIndex(index + 1);
    }
  };

  if (!current) {
    return (
      <div
        className="fade-in-up"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>
            Шикарно! У тебя получилось!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fade-in-up"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 0",
      }}
    >
      <SwipeCard
        product={current.name}
        categoryLabel={current.category}
        onSwipeLeft={handleLeft}
        onSwipeRight={handleRight}
        isMobile={isMobile}
        progressCount={index}
        progressTotal={total}
        motivationalMsg={motivationalMsg}
        tagText="Шаг 1"
      />
    </div>
  );
}

// ============ SCREEN 2 — STEP 2 FREQUENCY ============

function Step2Screen({ products, onComplete, isMobile }) {
  const [showExplanation, setShowExplanation] = useState(true);
  const [index, setIndex] = useState(0);
  const [regular, setRegular] = useState([]);
  const [occasional, setOccasional] = useState([]);

  const total = products.length;
  const pct = (index / total) * 100;
  const motivationalMsg = useMotivationalMsg(pct);

  const current = products[index];

  const handleRight = () => {
    const newRegular = [...regular, current];
    setRegular(newRegular);
    advance(newRegular, occasional);
  };

  const handleLeft = () => {
    const newOccasional = [...occasional, current];
    setOccasional(newOccasional);
    advance(regular, newOccasional);
  };

  const advance = (r, o) => {
    if (index + 1 >= total) {
      setIndex(index + 1);
      setTimeout(() => onComplete(r, o), 600);
    } else {
      setIndex(index + 1);
    }
  };

  if (showExplanation) {
    return (
      <div
        className="fade-in-up"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 480, width: "100%" }}>
          <div style={{ marginBottom: 20, textAlign: "center" }}>
            <TagPill>Шаг 2</TagPill>
          </div>
          <div
            style={{
              background: COLORS.card,
              borderRadius: 16,
              padding: "24px 28px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: COLORS.textPrimary,
                marginBottom: 12,
              }}
            >
              Как часто ты это ешь?
            </div>
            <div
              style={{
                fontSize: 14,
                color: COLORS.textSecondary,
                lineHeight: 1.7,
                marginBottom: 20,
              }}
            >
              Свайпай вправо — если ешь несколько раз в неделю.
              <br />
              Свайпай влево — если ешь 1–2 раза в две недели.
              <br />
              Это поможет сделать меню разнообразным, но привычным 🌿
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "14px 16px",
                background: COLORS.bg,
                borderRadius: 12,
                marginBottom: 24,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: COLORS.textPrimary }}>
                <span style={{ color: COLORS.accent, fontWeight: 800, fontSize: 16 }}>→</span>
                <span>
                  <b>Регулярно</b> (несколько раз в неделю)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: COLORS.textPrimary }}>
                <span style={{ color: COLORS.accent, fontWeight: 800, fontSize: 16 }}>←</span>
                <span>
                  <b>Редко</b> (1–2 раза в две недели)
                </span>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <GreenButton onClick={() => setShowExplanation(false)}>
                Понятно, начнём!
              </GreenButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div
        className="fade-in-up"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>
            Шикарно! Готово!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fade-in-up"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 0",
      }}
    >
      <SwipeCard
        product={current.name}
        categoryLabel={current.category}
        onSwipeLeft={handleLeft}
        onSwipeRight={handleRight}
        leftLabel="Редко"
        rightLabel="Регулярно"
        isMobile={isMobile}
        progressCount={index}
        progressTotal={total}
        motivationalMsg={motivationalMsg}
        tagText="Шаг 2"
        mode="step2"
      />
    </div>
  );
}

// ============ SCREEN 3 — GOAL SELECTION ============

function GoalScreen({ onSelect, initial }) {
  const [selected, setSelected] = useState(initial || null);

  return (
    <div
      className="fade-in-up"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 600, width: "100%", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <TagPill>Выбери цель</TagPill>
        </div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: COLORS.textPrimary,
            textAlign: "center",
            marginBottom: 8,
            marginTop: 16,
          }}
        >
          С какой целью составим меню?
        </h1>
        <div
          style={{
            fontSize: 15,
            color: COLORS.textSecondary,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          Выбери одно направление — меню подстроится под тебя
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <GoalCard
            selected={selected === "weight"}
            onClick={() => setSelected("weight")}
            title="Работа с весом"
            description="Задаёшь своё соотношение белков, жиров и углеводов — меню каждый день попадает точно в твои цифры."
          />
          <GoalCard
            selected={selected === "energy"}
            onClick={() => setSelected("energy")}
            title="Энергия и бодрость"
            description="Акцент на продукты, богатые железом, B12, фолиевой кислотой и витамином C — для тех, кто устаёт быстрее, чем хотелось бы."
          />
        </div>

        {selected && (
          <div
            className="fade-in"
            style={{ textAlign: "center", marginTop: 32 }}
          >
            <GreenButton onClick={() => onSelect(selected)}>Далее →</GreenButton>
          </div>
        )}
      </div>
    </div>
  );
}

function GoalCard({ selected, onClick, title, description }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: COLORS.card,
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        cursor: "pointer",
        border: selected || hover ? `2px solid ${COLORS.accent}` : "2px solid transparent",
        transition: "border-color 200ms ease, transform 200ms ease",
        position: "relative",
        transform: selected ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            display: "inline-block",
            background: COLORS.tagBg,
            color: COLORS.tagText,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.3,
            padding: "3px 10px",
            borderRadius: 20,
          }}
        >
          Доступно
        </span>
        {selected && (
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: COLORS.accent,
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 800,
              animation: "fadeIn 200ms ease",
            }}
          >
            ✓
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: COLORS.textPrimary,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 14,
          color: COLORS.textSecondary,
          lineHeight: 1.6,
        }}
      >
        {description}
      </div>
    </div>
  );
}

// ============ SCREEN 4A — KBJU INPUT ============

function KbjuScreen({ onSubmit, initial }) {
  const [protein, setProtein] = useState(initial?.protein ? String(initial.protein) : "");
  const [fat, setFat] = useState(initial?.fat ? String(initial.fat) : "");
  const [carbs, setCarbs] = useState(initial?.carbs ? String(initial.carbs) : "");

  const pNum = parseInt(protein, 10) || 0;
  const fNum = parseInt(fat, 10) || 0;
  const cNum = parseInt(carbs, 10) || 0;
  const kcal = pNum * 4 + fNum * 9 + cNum * 4;
  const valid = pNum > 0 && fNum > 0 && cNum > 0;

  return (
    <div
      className="fade-in-up"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: COLORS.card,
          borderRadius: 24,
          padding: 40,
          maxWidth: 440,
          width: "100%",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: COLORS.textPrimary,
            marginTop: 0,
            marginBottom: 8,
          }}
        >
          Укажи свою норму на день
        </h2>
        <div
          style={{
            fontSize: 14,
            color: COLORS.textSecondary,
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          Введи количество граммов белков, жиров и углеводов в сутки — меню будет составлено точно под твои цифры.
        </div>

        <KbjuInput label="Белки (г)" value={protein} onChange={setProtein} placeholder="например, 120" />
        <KbjuInput label="Жиры (г)" value={fat} onChange={setFat} placeholder="например, 60" />
        <KbjuInput label="Углеводы (г)" value={carbs} onChange={setCarbs} placeholder="например, 200" />

        <div
          style={{
            fontSize: 13,
            color: COLORS.textSecondary,
            marginTop: 20,
            marginBottom: 24,
            textAlign: "center",
            minHeight: 18,
          }}
        >
          {kcal > 0 && `Итого: ~${kcal} ккал/день`}
        </div>

        <GreenButton
          onClick={() => onSubmit({ protein: pNum, fat: fNum, carbs: cNum })}
          disabled={!valid}
          style={{ width: "100%", padding: "14px" }}
        >
          Готово ✓
        </GreenButton>
      </div>
    </div>
  );
}

function KbjuInput({ label, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginBottom: 12,
      }}
    >
      <label
        style={{
          fontSize: 14,
          color: COLORS.textPrimary,
          fontWeight: 600,
          minWidth: 110,
        }}
      >
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          flex: 1,
          border: `1.5px solid ${focused ? COLORS.accent : COLORS.border}`,
          borderRadius: 12,
          padding: "10px 14px",
          fontSize: 16,
          color: COLORS.textPrimary,
          background: "#fff",
          transition: "border-color 200ms ease",
          minWidth: 0,
          width: "100%",
        }}
      />
    </div>
  );
}

// ============ SCREEN 4B — ENERGY CONFIRMATION ============

function EnergyConfirmScreen({ onNext }) {
  return (
    <div
      className="fade-in-up"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: COLORS.card,
          borderRadius: 24,
          padding: 40,
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>🌿</div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: COLORS.textPrimary,
            marginTop: 0,
            marginBottom: 16,
          }}
        >
          Отлично!
        </h2>
        <div
          style={{
            fontSize: 15,
            color: COLORS.textSecondary,
            lineHeight: 1.7,
            marginBottom: 32,
          }}
        >
          Составим меню с акцентом на железо, витамин C, B12 и фолиевую кислоту — продукты, которые дают настоящую энергию.
        </div>
        <GreenButton onClick={onNext}>Составить меню →</GreenButton>
      </div>
    </div>
  );
}

// ============ SCREEN 5 — LOADING ============

function LoadingScreen({ regularProducts, occasionalProducts, goal, kbju, onComplete, onError }) {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [apiDone, setApiDone] = useState(false);
  const [apiResult, setApiResult] = useState(null);
  const [apiError, setApiError] = useState(null);
  const abortRef = useRef(null);

  const messages = [
    "Анализирую твои продукты... 🥦",
    "Составляю разнообразное меню... 🍳",
    "Учитываю частоту продуктов... ✨",
    "Почти готово... 🎉",
  ];

  // Kick off API call
  useEffect(() => {
    // Validate input
    if (!regularProducts || regularProducts.length === 0) {
      console.error("[menu-gen] No regular products — can't generate menu");
      setApiError({
        code: "no_products",
        message: "Нет ни одного регулярного продукта. Вернись на шаг 2 и отметь продукты.",
      });
      return;
    }

    const regNames = regularProducts.map((p) => p.name);
    const occNames = occasionalProducts.map((p) => p.name);
    const prompt = buildMenuPrompt(regNames, occNames, goal, kbju);

    console.log("[menu-gen] Starting API call");
    console.log("[menu-gen] Regular:", regNames.length, "Occasional:", occNames.length);
    console.log("[menu-gen] Goal:", goal, "KBJU:", kbju);

    // Setup timeout (90 seconds — API can be slow)
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => {
      console.error("[menu-gen] Request timeout (90s)");
      controller.abort();
    }, 90_000);

    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }],
      }),
    })
      .then(async (r) => {
        clearTimeout(timeoutId);
        const status = r.status;
        let body;
        try {
          body = await r.json();
        } catch (e) {
          const text = await r.text().catch(() => "");
          throw { code: "bad_response", status, raw: text, message: "Не удалось прочитать ответ API" };
        }
        if (!r.ok) {
          console.error("[menu-gen] API error:", status, body);
          throw {
            code: "api_error",
            status,
            raw: body,
            message: (body && body.error && body.error.message) || `API ответил со статусом ${status}`,
          };
        }
        return body;
      })
      .then((data) => {
        console.log("[menu-gen] Raw API response:", data);

        if (!data.content || !Array.isArray(data.content)) {
          throw {
            code: "empty_response",
            raw: data,
            message: "Ответ API не содержит content",
          };
        }

        const text = data.content
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n");

        console.log("[menu-gen] Raw text length:", text.length);
        console.log("[menu-gen] Stop reason:", data.stop_reason);
        console.log("[menu-gen] Tokens used:", data.usage);
        console.log("[menu-gen] Raw text (first 500):", text.slice(0, 500));
        console.log("[menu-gen] Raw text (last 500):", text.slice(-500));

        if (!text) {
          throw {
            code: "empty_text",
            raw: data,
            message: "API вернул пустой ответ",
          };
        }

        // Try to parse as JSON with repair fallback
        const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

        let parsed = null;
        // Attempt 1: direct parse
        try {
          parsed = JSON.parse(cleaned);
          console.log("[menu-gen] Parsed cleanly");
        } catch (e) {
          console.warn("[menu-gen] Direct parse failed, trying repair:", e.message);
          parsed = repairTruncatedJson(cleaned);
          if (parsed) console.log("[menu-gen] Repaired JSON successfully");
        }

        if (!parsed) {
          throw {
            code: "parse_error",
            raw: text,
            stop_reason: data.stop_reason,
            message:
              data.stop_reason === "max_tokens"
                ? "Ответ был обрезан по лимиту токенов — попробуй ещё раз"
                : "Не удалось распарсить ответ модели как JSON",
          };
        }

        // Sanity check structure
        if (!parsed.week || !Array.isArray(parsed.week) || parsed.week.length === 0) {
          throw {
            code: "invalid_structure",
            raw: parsed,
            message: "В ответе нет поля 'week' с массивом дней",
          };
        }

        // === POST-PROCESSING: пересчёт КБЖУ и подгонка граммовок ===
        // Для каждого блюда: берём ингредиенты с граммовками от ИИ, подгоняем
        // под нашу целевую долю дневной нормы, кладём рассчитанные КБЖУ.
        const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
        const targets = (goal === "weight" && kbju) ? distributeDailyTargets(kbju) : null;

        for (const day of parsed.week) {
          for (const mealType of mealTypes) {
            const meal = day[mealType];
            if (!meal) continue;
            // Нормализация ingredients — ИИ может вернуть массив строк вместо объектов
            if (Array.isArray(meal.ingredients)) {
              meal.ingredients = meal.ingredients
                .map((ing) => {
                  if (ing && typeof ing === "object" && ing.name) {
                    return { name: ing.name, grams: Number(ing.grams) || 100 };
                  }
                  // Если это строка — пропускаем (ИИ не соблюл формат)
                  return null;
                })
                .filter(Boolean);
            } else {
              meal.ingredients = [];
            }

            if (targets && meal.ingredients.length > 0) {
              // Цель — с поправкой на перекус vs основной приём
              const target = targets[mealType];
              const result = adjustMealToTarget(meal.ingredients, target, mealType);
              meal.ingredients = result.ingredients;
              meal.nutrition = result.nutrition;
              meal.target = target;
              // Насколько далеко от цели (0..1, где 0.15 = 15%)
              meal.deviation = maxDeviation(result.nutrition, target);
            } else if (meal.ingredients.length > 0) {
              // Без КБЖУ-цели (goal=energy) — просто считаем без подгонки
              meal.nutrition = calculateMealNutrition(meal.ingredients);
              meal.target = null;
              meal.deviation = 0;
            } else {
              meal.nutrition = { kcal: 0, protein: 0, fat: 0, carbs: 0, unknown: [] };
              meal.target = null;
              meal.deviation = 0;
            }

            // Удаляем устаревшие поля от ИИ (если вдруг пришли)
            delete meal.kcal;
            delete meal.protein;
            delete meal.fat;
            delete meal.carbs;
            delete meal.image_query;
          }
        }

        console.log("[menu-gen] Menu has", parsed.week.length, "days, post-processed");
        setApiResult(parsed);
        setApiDone(true);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
          console.error("[menu-gen] Aborted (timeout)");
          setApiError({ code: "timeout", message: "Сервер не ответил за 90 секунд" });
        } else if (err.code) {
          // Our own structured error
          setApiError(err);
        } else {
          console.error("[menu-gen] Unknown error:", err);
          setApiError({
            code: "network_error",
            message: err.message || "Ошибка сети",
            raw: String(err),
          });
        }
      });

    return () => {
      clearTimeout(timeoutId);
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Progress bar animation
  useEffect(() => {
    const duration = 4000;
    const stepMs = 40;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += stepMs;
      let pct = (elapsed / duration) * 100;
      if (pct >= 100) {
        pct = 100;
        clearInterval(interval);
      }
      setProgress(pct);
      if (pct >= 85) setMsgIndex(3);
      else if (pct >= 60) setMsgIndex(2);
      else if (pct >= 25) setMsgIndex(1);
      else setMsgIndex(0);
    }, stepMs);
    return () => clearInterval(interval);
  }, []);

  // When bar reaches 100%, wait for API & transition
  useEffect(() => {
    if (progress >= 100 && apiDone && apiResult) {
      const t = setTimeout(() => onComplete(apiResult), 500);
      return () => clearTimeout(t);
    }
  }, [progress, apiDone, apiResult, onComplete]);

  useEffect(() => {
    if (apiError) {
      const t = setTimeout(() => onError(apiError), 300);
      return () => clearTimeout(t);
    }
  }, [apiError, onError]);

  return (
    <div
      className="fade-in-up"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 400, width: "100%" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 320,
            height: 8,
            background: COLORS.border,
            borderRadius: 4,
            overflow: "hidden",
            margin: "0 auto 24px",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: COLORS.accent,
              borderRadius: 4,
              transition: "width 40ms linear",
            }}
          />
        </div>
        <div
          key={msgIndex}
          style={{
            fontSize: 16,
            color: COLORS.textPrimary,
            fontWeight: 500,
            animation: "fadeIn 400ms ease",
            minHeight: 24,
          }}
        >
          {messages[msgIndex]}
        </div>
        {progress >= 100 && !apiDone && !apiError && (
          <div
            style={{
              fontSize: 13,
              color: COLORS.textSecondary,
              marginTop: 12,
              animation: "fadeIn 400ms ease",
            }}
          >
            Дорабатываем меню...
          </div>
        )}
      </div>
    </div>
  );
}

// ============ ERROR SCREEN ============

function ErrorScreen({ onRetry, onBackToStep2, error }) {
  const [showDetails, setShowDetails] = useState(false);

  // error can be a string (legacy) or an object {code, message, raw, ...}
  const errorObj = typeof error === "string" ? { code: error, message: error } : (error || {});
  const friendlyMessages = {
    no_products: "Нет ни одного регулярного продукта. Вернись на шаг 2 и отметь хотя бы несколько.",
    timeout: "Сервер не ответил за 90 секунд. Попробуй ещё раз — возможно, временная загрузка.",
    network_error: "Проблема с соединением. Проверь интернет и попробуй снова.",
    api_error: "API вернул ошибку. Возможно, превышен лимит запросов.",
    empty_response: "API вернул пустой ответ.",
    empty_text: "API вернул пустой текст.",
    parse_error: "Не удалось разобрать ответ модели — попробуй ещё раз.",
    invalid_structure: "Ответ модели в неверном формате — попробуй ещё раз.",
    bad_response: "Сервер вернул неожиданный формат ответа.",
  };
  const friendlyMsg =
    errorObj.message ||
    friendlyMessages[errorObj.code] ||
    "Не удалось составить меню. Проверь соединение и попробуй ещё раз.";

  const showBackToStep2 = errorObj.code === "no_products";

  return (
    <div
      className="fade-in-up"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: COLORS.card,
          borderRadius: 24,
          padding: 36,
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>😕</div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: COLORS.textPrimary,
            marginTop: 0,
            marginBottom: 12,
          }}
        >
          Что-то пошло не так
        </h2>
        <div
          style={{
            fontSize: 15,
            color: COLORS.textSecondary,
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          {friendlyMsg}
        </div>

        {errorObj.code && (
          <div
            style={{
              fontSize: 11,
              color: COLORS.muted,
              marginBottom: 20,
              fontFamily: "monospace",
            }}
          >
            код: {errorObj.code}
            {errorObj.status ? ` · HTTP ${errorObj.status}` : ""}
            {errorObj.stop_reason ? ` · stop: ${errorObj.stop_reason}` : ""}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {showBackToStep2 && onBackToStep2 && (
            <OutlineButton onClick={onBackToStep2}>Вернуться к продуктам</OutlineButton>
          )}
          <GreenButton onClick={onRetry}>Попробовать снова</GreenButton>
        </div>

        {errorObj.raw && (
          <div style={{ marginTop: 24, textAlign: "left" }}>
            <button
              onClick={() => setShowDetails((s) => !s)}
              style={{
                background: "transparent",
                border: "none",
                color: COLORS.textSecondary,
                fontSize: 12,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              {showDetails ? "Скрыть детали" : "Показать детали ошибки"}
            </button>
            {showDetails && (
              <pre
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: "#F5F1EA",
                  borderRadius: 10,
                  fontSize: 11,
                  color: COLORS.textPrimary,
                  maxHeight: 240,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "monospace",
                }}
              >
                {typeof errorObj.raw === "string"
                  ? errorObj.raw
                  : JSON.stringify(errorObj.raw, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ SCREEN 6 — MENU RESULT ============

const MEAL_META = {
  breakfast: { label: "Завтрак", bg: "#FDF6E3", color: "#A07C1A" },
  lunch: { label: "Обед", bg: "#E8F3EC", color: "#2D5A3D" },
  dinner: { label: "Ужин", bg: "#EEF2FF", color: "#3D4F8A" },
  snack: { label: "Перекус", bg: "#FDF0EC", color: "#B6522A" },
};

function MenuScreen({ menu, onShoppingList, onRegenerate, onEditGoal, onEditProducts }) {
  const [expandedDay, setExpandedDay] = useState(0);
  const [selectedMeal, setSelectedMeal] = useState(null); // { meal, type } or null
  const dayRefs = useRef([]);

  const week = menu?.week || [];

  const totalMeals = week.reduce((sum, day) => {
    return sum + ["breakfast", "lunch", "dinner", "snack"].filter((m) => day[m]).length;
  }, 0);

  const dayTotalKcal = (day) => {
    return ["breakfast", "lunch", "dinner", "snack"].reduce(
      (s, k) => s + ((day[k] && day[k].kcal) || 0),
      0
    );
  };

  const scrollToDay = (i) => {
    setExpandedDay(i);
    if (dayRefs.current[i]) {
      dayRefs.current[i].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      className="fade-in-up"
      style={{ minHeight: "100vh", paddingBottom: 120 }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", padding: "32px 24px 0" }}>
        <div style={{ marginBottom: 16 }}>
          <TagPill>Твоё меню на неделю</TagPill>
        </div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: COLORS.textPrimary,
            margin: "8px 0",
          }}
        >
          Готово! Вот твоё меню 🎉
        </h1>
        <div
          style={{
            fontSize: 14,
            color: COLORS.textSecondary,
            marginBottom: 24,
          }}
        >
          7 дней · {totalMeals} блюд · все из твоих продуктов
        </div>
      </div>

      {/* Day pills */}
      <div
        className="day-pill-scroll"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          padding: "0 24px 24px",
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        {week.map((day, i) => (
          <button
            key={i}
            onClick={() => scrollToDay(i)}
            style={{
              background: expandedDay === i ? COLORS.accent : COLORS.card,
              color: expandedDay === i ? "#fff" : COLORS.textPrimary,
              border: "none",
              borderRadius: 12,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              flexShrink: 0,
            }}
          >
            {day.day}
          </button>
        ))}
      </div>

      {/* Days list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: "0 24px",
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        {week.map((day, i) => (
          <div
            key={i}
            ref={(el) => (dayRefs.current[i] = el)}
            style={{
              background: COLORS.card,
              borderRadius: 20,
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              padding: "20px 24px",
              cursor: "pointer",
              transition: "box-shadow 200ms ease",
            }}
            onClick={() => setExpandedDay(expandedDay === i ? -1 : i)}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                }}
              >
                {day.day}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: COLORS.textSecondary,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span>{dayTotalKcal(day)} ккал</span>
                <span
                  style={{
                    display: "inline-block",
                    transform: expandedDay === i ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 300ms ease",
                    fontSize: 12,
                    color: COLORS.muted,
                  }}
                >
                  ▼
                </span>
              </div>
            </div>

            {expandedDay === i && (
              <div
                style={{ marginTop: 12, animation: "fadeIn 300ms ease" }}
                onClick={(e) => e.stopPropagation()}
              >
                {["breakfast", "lunch", "dinner", "snack"].map(
                  (mealKey) =>
                    day[mealKey] && (
                      <MealRow
                        key={mealKey}
                        meal={day[mealKey]}
                        type={mealKey}
                        onClick={() => setSelectedMeal({ meal: day[mealKey], type: mealKey })}
                      />
                    )
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action buttons row: regenerate / edit goal / edit products */}
      <div
        style={{
          maxWidth: 800,
          margin: "32px auto 0",
          padding: "0 24px",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {onRegenerate && (
          <OutlineButton onClick={onRegenerate} style={{ padding: "10px 18px", fontSize: 14 }}>
            🔄 Новое меню
          </OutlineButton>
        )}
        {onEditGoal && (
          <OutlineButton onClick={onEditGoal} style={{ padding: "10px 18px", fontSize: 14 }}>
            🎯 Изменить цель
          </OutlineButton>
        )}
        {onEditProducts && (
          <OutlineButton onClick={onEditProducts} style={{ padding: "10px 18px", fontSize: 14 }}>
            🛒 Изменить продукты
          </OutlineButton>
        )}
      </div>

      {/* Bottom CTA */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(250,247,242,0.95)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          padding: "20px 24px",
          borderTop: `1px solid ${COLORS.divider}`,
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <GreenButton
            onClick={onShoppingList}
            pulsing
            style={{ width: "100%", padding: "14px" }}
          >
            Получить список покупок 🛒
          </GreenButton>
        </div>
      </div>

      {/* Recipe bottom sheet */}
      {selectedMeal && (
        <RecipeSheet
          meal={selectedMeal.meal}
          mealType={selectedMeal.type}
          onClose={() => setSelectedMeal(null)}
        />
      )}
    </div>
  );
}

function MealRow({ meal, type, onClick }) {
  const meta = MEAL_META[type];
  const emoji = guessImageQuery(meal.name, meal.ingredients);
  const n = meal.nutrition || { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  const warn = (meal.deviation || 0) > 0.2;

  return (
    <div
      onClick={onClick}
      style={{
        borderTop: `1px solid ${COLORS.divider}`,
        padding: "14px 0",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        transition: "background 150ms ease",
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.background = "rgba(74,124,89,0.03)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Thumbnail — эмодзи */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 12,
          flexShrink: 0,
          background: meta.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
        }}
      >
        {emoji}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 6, display: "flex", gap: 6, alignItems: "center" }}>
          <span
            style={{
              display: "inline-block",
              background: meta.bg,
              color: meta.color,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              padding: "3px 8px",
              borderRadius: 12,
            }}
          >
            {meta.label}
          </span>
          {warn && (
            <span
              title={`Отклонение от нормы: ${Math.round(meal.deviation * 100)}%`}
              style={{
                fontSize: 13,
                color: COLORS.error,
                lineHeight: 1,
              }}
            >
              ⚠️
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: COLORS.textPrimary,
            marginBottom: 4,
          }}
        >
          {meal.name}
        </div>
        {meal.description && (
          <div
            style={{
              fontSize: 13,
              color: COLORS.textSecondary,
              lineHeight: 1.5,
              marginBottom: 6,
            }}
          >
            {meal.description}
          </div>
        )}
        <div style={{ fontSize: 12, color: COLORS.muted }}>
          Б: {n.protein}г · Ж: {n.fat}г · У: {n.carbs}г · {n.kcal}ккал
        </div>
      </div>

      {/* Chevron hint */}
      {onClick && (
        <div
          style={{
            color: COLORS.muted,
            fontSize: 18,
            alignSelf: "center",
            paddingLeft: 4,
            flexShrink: 0,
          }}
        >
          ›
        </div>
      )}
    </div>
  );
}

// ============ RECIPE BOTTOM SHEET ============

function RecipeSheet({ meal, mealType, onClose }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const sheetRef = useRef(null);
  const dragStartY = useRef(null);
  const [dragY, setDragY] = useState(0);

  const meta = MEAL_META[mealType];
  const emoji = guessImageQuery(meal.name, meal.ingredients);
  const cacheKey = `${meal.name}|${meal.nutrition?.kcal || 0}`;

  // Load recipe: check cache first, otherwise call API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadRecipeCache();
      const cached = getRecipeFromCache(cacheKey);
      if (cached) {
        console.log("[recipe] Cache hit for:", meal.name);
        if (!cancelled) {
          setRecipe(cached);
          setLoading(false);
        }
        return;
      }

      console.log("[recipe] Fetching recipe for:", meal.name);
      const prompt = buildRecipePrompt(meal);
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2000,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
        }
        const data = await res.json();
        const text = (data.content || [])
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n");
        const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

        let parsed = null;
        try {
          parsed = JSON.parse(cleaned);
        } catch (e) {
          parsed = repairTruncatedJson(cleaned);
        }

        if (!parsed || !parsed.steps) {
          throw new Error("Некорректный ответ модели");
        }

        console.log("[recipe] Got recipe:", parsed);
        await saveRecipeToCache(cacheKey, parsed);
        if (!cancelled) {
          setRecipe(parsed);
          setLoading(false);
        }
      } catch (err) {
        console.error("[recipe] Error:", err);
        if (!cancelled) {
          setError(err.message || "Не удалось получить рецепт");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => onClose(), 280);
  }, [onClose]);

  // Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Touch handlers for swipe-down-to-close
  const onTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    if (dragStartY.current === null) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    if (dy > 0) setDragY(dy);
  };
  const onTouchEnd = () => {
    if (dragY > 100) {
      handleClose();
    } else {
      setDragY(0);
    }
    dragStartY.current = null;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(44,44,42,0.5)",
          zIndex: 100,
          animation: isClosing ? "fadeOut 280ms ease forwards" : "fadeIn 280ms ease",
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "88vh",
          background: COLORS.bg,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.25)",
          zIndex: 101,
          transform: isClosing
            ? "translateY(100%)"
            : `translateY(${dragY}px)`,
          animation: isClosing ? undefined : "sheetUp 320ms cubic-bezier(0.2, 0.9, 0.3, 1)",
          transition: dragY === 0 && !isClosing ? "transform 200ms ease" : "transform 280ms ease",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Drag handle (also the touch area for swipe down) */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            padding: "12px 0 4px",
            display: "flex",
            justifyContent: "center",
            cursor: "grab",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: "#D3CEC4",
            }}
          />
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1, WebkitOverflowScrolling: "touch" }}>
          {/* Hero — большое эмодзи */}
          <div
            style={{
              width: "100%",
              height: 220,
              background: meta.bg,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 96, lineHeight: 1 }}>{emoji}</div>
            {/* Close button */}
            <button
              onClick={handleClose}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,0.9)",
                fontSize: 18,
                color: COLORS.textPrimary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: "20px 24px 40px", maxWidth: 640, margin: "0 auto" }}>
            <div style={{ marginBottom: 8 }}>
              <span
                style={{
                  display: "inline-block",
                  background: meta.bg,
                  color: meta.color,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: 12,
                }}
              >
                {meta.label}
              </span>
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: COLORS.textPrimary,
                margin: "0 0 8px",
                lineHeight: 1.3,
              }}
            >
              {meal.name}
            </h2>
            {meal.description && (
              <div
                style={{
                  fontSize: 14,
                  color: COLORS.textSecondary,
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                {meal.description}
              </div>
            )}

            {/* Quick-glance ingredients from meal payload */}
            {meal.ingredients && meal.ingredients.length > 0 && (
              <div
                style={{
                  background: COLORS.card,
                  borderRadius: 14,
                  padding: "14px 16px",
                  marginBottom: 16,
                  fontSize: 13,
                  color: COLORS.textSecondary,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 700, color: COLORS.textPrimary, marginBottom: 6 }}>
                  Что понадобится:
                </div>
                {meal.ingredients.map((ing, idx) => {
                  if (typeof ing === "string") {
                    return (
                      <div key={idx}>{ing}</div>
                    );
                  }
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{ing.name}</span>
                      <span style={{ color: COLORS.muted, marginLeft: 12 }}>{ing.grams} г</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* KBJU pills — из рассчитанной nutrition */}
            {meal.nutrition && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <KcalPill label="Ккал" value={meal.nutrition.kcal} color={COLORS.accent} />
                <KcalPill label="Б" value={`${meal.nutrition.protein}г`} />
                <KcalPill label="Ж" value={`${meal.nutrition.fat}г`} />
                <KcalPill label="У" value={`${meal.nutrition.carbs}г`} />
              </div>
            )}

            {/* Предупреждение, если блюдо не вписывается в норму */}
            {meal.deviation > 0.2 && meal.target && (
              <div
                style={{
                  background: "#FFF4EC",
                  border: `1px solid ${COLORS.error}`,
                  borderRadius: 12,
                  padding: "10px 14px",
                  marginBottom: 20,
                  fontSize: 13,
                  color: COLORS.textPrimary,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 2 }}>
                  ⚠️ Блюдо не попадает в целевые КБЖУ
                </div>
                <div style={{ color: COLORS.textSecondary }}>
                  Цель: Б {meal.target.protein}г · Ж {meal.target.fat}г · У {meal.target.carbs}г · {meal.target.kcal}ккал.
                  Отклонение {Math.round(meal.deviation * 100)}% — это ограничение выбранных ингредиентов.
                </div>
              </div>
            )}

            <div style={{ marginBottom: 8 }} />

            {/* Loading state */}
            {loading && <RecipeSkeleton />}

            {/* Error */}
            {error && !loading && (
              <div
                style={{
                  background: "#FDF0EC",
                  borderRadius: 14,
                  padding: "16px 18px",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    color: COLORS.error,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Не удалось загрузить рецепт
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
                  {error}
                </div>
              </div>
            )}

            {/* Recipe content */}
            {recipe && !loading && (
              <RecipeContent recipe={recipe} />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sheetUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

function KcalPill({ label, value, color }) {
  return (
    <div
      style={{
        background: color ? `${color}15` : "#F2EDE4",
        color: color || COLORS.textPrimary,
        padding: "6px 12px",
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span style={{ opacity: 0.7, fontSize: 11, marginRight: 4 }}>{label}</span>
      {value}
    </div>
  );
}

function RecipeContent({ recipe }) {
  return (
    <div>
      {/* Meta row */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {recipe.time_minutes && (
          <MetaItem icon="⏱" label="Время" value={`${recipe.time_minutes} мин`} />
        )}
        {recipe.difficulty && (
          <MetaItem icon="📊" label="Сложность" value={recipe.difficulty} />
        )}
        {recipe.servings && (
          <MetaItem icon="🍽" label="Порций" value={recipe.servings} />
        )}
      </div>

      {/* Ingredients */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3
            style={{
              fontSize: 13,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: COLORS.accent,
              fontWeight: 700,
              margin: "0 0 12px",
            }}
          >
            Ингредиенты
          </h3>
          <div
            style={{
              background: COLORS.card,
              borderRadius: 14,
              padding: "4px 16px",
            }}
          >
            {recipe.ingredients.map((ing, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${COLORS.divider}`,
                  fontSize: 14,
                }}
              >
                <span style={{ color: COLORS.textPrimary }}>{ing.name}</span>
                <span style={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                  {ing.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {recipe.steps && recipe.steps.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              fontSize: 13,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: COLORS.accent,
              fontWeight: 700,
              margin: "0 0 12px",
            }}
          >
            Приготовление
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recipe.steps.map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "14px 16px",
                  background: COLORS.card,
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: COLORS.accent,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: COLORS.textPrimary,
                    lineHeight: 1.6,
                    flex: 1,
                  }}
                >
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {recipe.tips && (
        <div
          style={{
            background: COLORS.tagBg,
            borderRadius: 14,
            padding: "14px 18px",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: 16 }}>💡</span>
          <div
            style={{
              fontSize: 13,
              color: COLORS.darkGreen,
              lineHeight: 1.6,
              flex: 1,
            }}
          >
            {recipe.tips}
          </div>
        </div>
      )}
    </div>
  );
}

function MetaItem({ icon, label, value }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 90,
        background: COLORS.card,
        borderRadius: 12,
        padding: "10px 12px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: COLORS.muted,
          fontWeight: 700,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>
        {value}
      </div>
    </div>
  );
}

function RecipeSkeleton() {
  const lines = [60, 75, 85, 65];
  return (
    <div style={{ animation: "fadeIn 300ms ease" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 70,
              borderRadius: 12,
              background: "linear-gradient(90deg, #F2EDE4 0%, #EDEAE3 50%, #F2EDE4 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s ease-in-out infinite",
            }}
          />
        ))}
      </div>
      <div
        style={{
          height: 14,
          width: "30%",
          background: "#EDEAE3",
          borderRadius: 4,
          marginBottom: 12,
        }}
      />
      {lines.map((w, i) => (
        <div
          key={i}
          style={{
            height: 48,
            background: "linear-gradient(90deg, #F2EDE4 0%, #EDEAE3 50%, #F2EDE4 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s ease-in-out infinite",
            borderRadius: 12,
            marginBottom: 10,
            width: `${w}%`,
          }}
        />
      ))}
      <div
        style={{
          marginTop: 16,
          fontSize: 13,
          color: COLORS.textSecondary,
          textAlign: "center",
        }}
      >
        Готовлю рецепт... ✨
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// ============ SCREEN 7 — SHOPPING LIST ============

function ShoppingListScreen({ menu, allEatenProducts, onReset }) {
  const [checked, setChecked] = useState({});
  const [copied, setCopied] = useState(false);

  // Group products by category using PRODUCT_CATEGORIES
  const shoppingItems = useMemo(() => {
    const fromApi = menu?.shopping_list || [];
    // Fallback: use eaten products if empty
    const source = fromApi.length > 0 ? fromApi : allEatenProducts.map((p) => p.name);

    // Lookup table: product name -> category
    const lookup = {};
    ALL_PRODUCTS.forEach((p) => {
      lookup[p.name.toLowerCase()] = p.category;
    });

    const grouped = {};
    source.forEach((item) => {
      const key = item.toLowerCase();
      let cat = lookup[key];
      if (!cat) {
        // try partial match
        const match = ALL_PRODUCTS.find(
          (p) =>
            p.name.toLowerCase().includes(key) ||
            key.includes(p.name.toLowerCase())
        );
        cat = match ? match.category : "Прочее";
      }
      if (!grouped[cat]) grouped[cat] = [];
      if (!grouped[cat].includes(item)) grouped[cat].push(item);
    });

    // Return in the original category order
    return PRODUCT_CATEGORIES.map((c) => ({
      name: c.name,
      items: grouped[c.name] || [],
    })).filter((g) => g.items.length > 0);
  }, [menu, allEatenProducts]);

  const toggle = (key) => {
    setChecked((c) => ({ ...c, [key]: !c[key] }));
  };

  const copyList = () => {
    const text = shoppingItems
      .map((g) => `${g.name}\n${g.items.map((i) => `• ${i}`).join("\n")}`)
      .join("\n\n");
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fade-in-up"
      style={{ minHeight: "100vh", paddingBottom: 40 }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <TagPill>Список покупок</TagPill>
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.textPrimary,
            margin: "0 0 8px",
          }}
        >
          Список на неделю
        </h1>
        <div
          style={{
            fontSize: 14,
            color: COLORS.textSecondary,
            marginBottom: 28,
          }}
        >
          Все продукты из твоего меню — в одном месте
        </div>

        <div
          style={{
            background: COLORS.card,
            borderRadius: 20,
            padding: "8px 20px 20px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            marginBottom: 24,
          }}
        >
          {shoppingItems.map((group) => (
            <div key={group.name} style={{ marginTop: 20 }}>
              <div
                style={{
                  fontSize: 13,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  color: COLORS.accent,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                {group.name}
              </div>
              {group.items.map((item) => {
                const key = group.name + "|" + item;
                const isChecked = !!checked[key];
                return (
                  <div
                    key={key}
                    onClick={() => toggle(key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 0",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        border: `2px solid ${isChecked ? COLORS.accent : COLORS.border}`,
                        background: isChecked ? COLORS.accent : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0,
                        transition: "all 200ms ease",
                      }}
                    >
                      {isChecked && "✓"}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: isChecked ? COLORS.muted : COLORS.textPrimary,
                        textDecoration: isChecked ? "line-through" : "none",
                        transition: "color 200ms ease",
                      }}
                    >
                      {item}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <OutlineButton onClick={onReset}>Начать заново</OutlineButton>
          <OutlineButton onClick={copyList}>
            {copied ? "Скопировано ✓" : "Скопировать список"}
          </OutlineButton>
        </div>
      </div>
    </div>
  );
}

// ============ EDIT PRODUCTS SCREEN ============
// List-based editor: every product in current universe shown with its current
// status (не ем / редко / регулярно). Tap to cycle through states.

function EditProductsScreen({
  eatenProducts,
  regularProducts,
  occasionalProducts,
  onSave,
  onCancel,
}) {
  // Build current status map: product name -> "none" | "rare" | "regular"
  const initialStatus = useMemo(() => {
    const m = {};
    ALL_PRODUCTS.forEach((p) => {
      m[p.name] = "none";
    });
    (eatenProducts || []).forEach((p) => {
      m[p.name || p] = "rare"; // default eaten -> rare if no freq info
    });
    (occasionalProducts || []).forEach((p) => {
      m[p.name || p] = "rare";
    });
    (regularProducts || []).forEach((p) => {
      m[p.name || p] = "regular";
    });
    return m;
  }, [eatenProducts, regularProducts, occasionalProducts]);

  const [status, setStatus] = useState(initialStatus);

  const cycleStatus = (name) => {
    setStatus((s) => {
      const cur = s[name] || "none";
      const next = cur === "none" ? "rare" : cur === "rare" ? "regular" : "none";
      return { ...s, [name]: next };
    });
  };

  const setStatusExplicit = (name, newStatus) => {
    setStatus((s) => ({ ...s, [name]: newStatus }));
  };

  const handleSave = () => {
    const newEaten = [];
    const newRegular = [];
    const newOccasional = [];
    ALL_PRODUCTS.forEach((p) => {
      const st = status[p.name];
      if (st === "rare") {
        newEaten.push(p);
        newOccasional.push(p);
      } else if (st === "regular") {
        newEaten.push(p);
        newRegular.push(p);
      }
    });
    onSave({
      eatenProducts: newEaten,
      regularProducts: newRegular,
      occasionalProducts: newOccasional,
    });
  };

  // Count per status
  const counts = useMemo(() => {
    let none = 0, rare = 0, regular = 0;
    Object.values(status).forEach((s) => {
      if (s === "regular") regular++;
      else if (s === "rare") rare++;
      else none++;
    });
    return { none, rare, regular };
  }, [status]);

  return (
    <div
      className="fade-in-up"
      style={{ minHeight: "100vh", paddingBottom: 140 }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 0" }}>
        <div style={{ marginBottom: 14 }}>
          <TagPill>Изменить продукты</TagPill>
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.textPrimary,
            margin: "0 0 8px",
          }}
        >
          Твои продукты
        </h1>
        <div
          style={{
            fontSize: 14,
            color: COLORS.textSecondary,
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          Жми на карточку, чтобы переключить: не ем → редко → регулярно.
          Или используй цветные кнопки справа.
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 20,
            fontSize: 12,
            color: COLORS.textSecondary,
          }}
        >
          <LegendDot color="#E8E2D9" label={`Не ем · ${counts.none}`} />
          <LegendDot color="#CDE4D4" label={`Редко · ${counts.rare}`} />
          <LegendDot color={COLORS.accent} label={`Регулярно · ${counts.regular}`} filled />
        </div>

        {/* Product list by category */}
        {PRODUCT_CATEGORIES.map((cat) => (
          <div key={cat.name} style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 12,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: COLORS.accent,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              {cat.name}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {cat.items.map((item) => (
                <ProductRow
                  key={item}
                  name={item}
                  status={status[item] || "none"}
                  onClick={() => cycleStatus(item)}
                  onSet={(s) => setStatusExplicit(item, s)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky bottom bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(250,247,242,0.95)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          padding: "16px 20px",
          borderTop: `1px solid ${COLORS.divider}`,
          zIndex: 10,
          display: "flex",
          gap: 10,
          justifyContent: "center",
        }}
      >
        <OutlineButton onClick={onCancel} style={{ padding: "12px 22px" }}>
          Отмена
        </OutlineButton>
        <GreenButton
          onClick={handleSave}
          style={{ padding: "13px 28px", flex: 1, maxWidth: 320 }}
        >
          Сохранить
        </GreenButton>
      </div>
    </div>
  );
}

function LegendDot({ color, label, filled }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: filled ? color : "transparent",
          border: `1.5px solid ${color}`,
          display: "inline-block",
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function ProductRow({ name, status, onClick, onSet }) {
  const bg =
    status === "regular"
      ? COLORS.accent
      : status === "rare"
      ? "#CDE4D4"
      : COLORS.card;
  const textColor = status === "regular" ? "#fff" : COLORS.textPrimary;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        background: bg,
        borderRadius: 12,
        padding: "12px 14px",
        cursor: "pointer",
        border: status === "none" ? `1px solid ${COLORS.border}` : "1px solid transparent",
        transition: "background 200ms ease, color 200ms ease",
        gap: 10,
      }}
    >
      <div
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: 500,
          color: textColor,
          transition: "color 200ms ease",
        }}
      >
        {name}
      </div>
      {/* Quick-set buttons */}
      <div
        style={{ display: "flex", gap: 4 }}
        onClick={(e) => e.stopPropagation()}
      >
        <QuickBtn
          active={status === "none"}
          onClick={() => onSet("none")}
          label="✕"
          title="Не ем"
          activeColor="#A0A09D"
        />
        <QuickBtn
          active={status === "rare"}
          onClick={() => onSet("rare")}
          label="✓"
          title="Редко"
          activeColor={COLORS.accent}
        />
        <QuickBtn
          active={status === "regular"}
          onClick={() => onSet("regular")}
          label="✓✓"
          title="Регулярно"
          activeColor={COLORS.accent}
          wider
        />
      </div>
    </div>
  );
}

function QuickBtn({ active, onClick, label, title, activeColor, wider }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        minWidth: wider ? 32 : 26,
        height: 26,
        padding: "0 6px",
        borderRadius: 7,
        border: `1.5px solid ${active ? activeColor : "rgba(0,0,0,0.12)"}`,
        background: active ? activeColor : "rgba(255,255,255,0.6)",
        color: active ? "#fff" : COLORS.textSecondary,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: wider ? -1 : 0,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

// ============ PRODUCTS DIFF SCREEN ============
// Shown when saved state's product universe differs from current (soft
// migration). User sees only the NEW products as swipe cards; existing
// answers are preserved.

function ProductsDiffScreen({ newProducts, onComplete, isMobile }) {
  const [showIntro, setShowIntro] = useState(true);
  const [index, setIndex] = useState(0);
  const [newEaten, setNewEaten] = useState([]);
  const total = newProducts.length;

  const current = newProducts[index];

  if (showIntro) {
    return (
      <div
        className="fade-in-up"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 440, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <TagPill>Обновление</TagPill>
          </div>
          <div
            style={{
              background: COLORS.card,
              borderRadius: 20,
              padding: 32,
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>✨</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: COLORS.textPrimary,
                marginBottom: 12,
              }}
            >
              У нас появились новые продукты
            </div>
            <div
              style={{
                fontSize: 15,
                color: COLORS.textSecondary,
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              Оцени {total === 1 ? "этот продукт" : `эти ${total} продукта`} — свайпай вправо, если ешь, влево, если нет. Твои предыдущие ответы сохранены.
            </div>
            <GreenButton onClick={() => setShowIntro(false)}>Начать</GreenButton>
          </div>
        </div>
      </div>
    );
  }

  const handleRight = () => {
    const next = [...newEaten, current];
    setNewEaten(next);
    advance(next);
  };
  const handleLeft = () => {
    advance(newEaten);
  };
  const advance = (latest) => {
    if (index + 1 >= total) {
      setIndex(index + 1);
      setTimeout(() => onComplete(latest), 600);
    } else {
      setIndex(index + 1);
    }
  };

  if (!current) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Готово!</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fade-in-up"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 0",
      }}
    >
      <SwipeCard
        product={current.name}
        categoryLabel={current.category}
        onSwipeLeft={handleLeft}
        onSwipeRight={handleRight}
        isMobile={isMobile}
        progressCount={index}
        progressTotal={total}
        motivationalMsg={null}
        tagText="Новые продукты"
      />
    </div>
  );
}

// ============ MAIN APP ============

export default function App() {
  const isMobile = useIsMobile();
  const [screen, setScreen] = useState("loading"); // "loading" until we check storage
  const [eatenProducts, setEatenProducts] = useState([]);
  const [regularProducts, setRegularProducts] = useState([]);
  const [occasionalProducts, setOccasionalProducts] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [kbju, setKbju] = useState(null);
  const [generatedMenu, setGeneratedMenu] = useState(null);
  const [newProductsToAsk, setNewProductsToAsk] = useState([]); // for diff flow
  const [lastError, setLastError] = useState(null);

  // ---- Persist helpers ----
  const saveState = useCallback(async (partial) => {
    const current = await storageGet(STORAGE_KEY) || {};
    const merged = {
      ...current,
      ...partial,
      version: PRODUCTS_VERSION,
      allKnownProducts: ALL_PRODUCTS.map((p) => p.name),
      updatedAt: Date.now(),
    };
    await storageSet(STORAGE_KEY, merged);
  }, []);

  const clearStorage = useCallback(async () => {
    await storageDelete(STORAGE_KEY);
  }, []);

  // ---- Load saved state on mount ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await storageGet(STORAGE_KEY);
      if (cancelled) return;

      if (!saved || !saved.eatenProducts) {
        // No valid save → start fresh onboarding
        setScreen(0);
        return;
      }

      // Reconcile product lists with current universe (soft migration)
      const { reconciled, newProducts } = reconcileProducts(saved, ALL_PRODUCTS);

      // Hydrate state from saved
      setEatenProducts(reconciled.eaten);
      setRegularProducts(reconciled.regular);
      setOccasionalProducts(reconciled.occasional);
      setSelectedGoal(saved.selectedGoal || null);
      setKbju(saved.kbju || null);
      setGeneratedMenu(saved.generatedMenu || null);

      // If there are new products since last version, ask about them first
      if (newProducts.length > 0 && saved.version !== PRODUCTS_VERSION) {
        setNewProductsToAsk(newProducts);
        setScreen("diff");
        return;
      }

      // If we have a saved menu, go straight to it; otherwise go to goal screen
      if (saved.generatedMenu) {
        setScreen(6);
      } else if (saved.selectedGoal) {
        setScreen(saved.selectedGoal === "weight" && !saved.kbju ? 4 : 5);
      } else {
        setScreen(3);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Reset to start ----
  const reset = async () => {
    await clearStorage();
    setEatenProducts([]);
    setRegularProducts([]);
    setOccasionalProducts([]);
    setSelectedGoal(null);
    setKbju(null);
    setGeneratedMenu(null);
    setNewProductsToAsk([]);
    setScreen(0);
  };

  // ---- DEV-ONLY: skip onboarding with fake data ----
  // Picks a realistic subset of products and marks them as regular/occasional,
  // then jumps straight to goal selection.
  const devSkip = async () => {
    // Realistic "regular" set (~25 products someone eats often)
    const regularNames = [
      "Помидоры", "Огурцы", "Морковь", "Картофель", "Капуста белокочанная",
      "Чеснок", "Шпинат", "Авокадо",
      "Яблоко", "Банан", "Лимон",
      "Петрушка", "Укроп", "Зелёный лук",
      "Курица", "Индейка", "Говядина",
      "Красная рыба (лосось, форель, кижуч, горбуша)", "Креветки",
      "Яйца",
      "Молоко", "Кефир", "Греческий йогурт", "Творог", "Сметана",
      "Пармезан", "Мягкие сыры (Моцарелла, Адыгейский)",
      "Овсянка", "Гречка", "Рис белый", "Киноа", "Чечевица",
      "Макароны", "Хлеб", "Мёд",
      "Грецкие орехи", "Миндаль", "Семена чиа",
      "Оливковое", "Сливочное",
      "Тёмный шоколад", "Кофе", "Чай зелёный",
    ];
    // "Occasional" set (~15 products)
    const occasionalNames = [
      "Болгарский перец", "Брокколи", "Тыква", "Батат", "Руккола",
      "Груша", "Апельсин", "Манго",
      "Клубника", "Голубика", "Малина",
      "Базилик",
      "Баранина", "Кролик", "Субпродукты",
      "Белая рыба (треска, минтай)", "Мидии",
      "Сливки",
      "Сыры с плесенью (Бри, Камамбер, Дор Блю, Горгонзола)",
      "Булгур", "Фасоль",
      "Томатная паста",
      "Кешью", "Тыквенные семечки", "Семена льна",
      "Финики", "Курага",
      "Кокосовое", "Льняное",
      "Какао-порошок", "Чай травяной",
    ];

    // Build product objects by resolving names against ALL_PRODUCTS
    const byName = {};
    ALL_PRODUCTS.forEach((p) => { byName[p.name] = p; });
    const regular = regularNames.map((n) => byName[n]).filter(Boolean);
    const occasional = occasionalNames.map((n) => byName[n]).filter(Boolean);
    const eaten = [...regular, ...occasional];

    setEatenProducts(eaten);
    setRegularProducts(regular);
    setOccasionalProducts(occasional);
    await saveState({
      eatenProducts: eaten,
      regularProducts: regular,
      occasionalProducts: occasional,
    });
    console.log("[dev-skip] Filled:", regular.length, "regular,", occasional.length, "occasional");
    setScreen(3);
  };

  // ---- New menu action (from Screen 6) ----
  const regenerateMenu = () => {
    setGeneratedMenu(null);
    // Clear saved menu so it won't be shown on reload before regen finishes
    saveState({ generatedMenu: null });
    setScreen(5);
  };

  // ---- Edit goal action ----
  const editGoal = () => {
    setScreen(3);
  };

  // ---- Edit products action ----
  const editProducts = () => {
    setScreen("editProducts");
  };

  // ---- Diff flow completion ----
  const handleDiffComplete = async (newEaten) => {
    // newEaten = products from newProductsToAsk that user marked as "eat"
    // We treat them as "regular" by default (user can edit later via Screen 8)
    const mergedEaten = [...eatenProducts, ...newEaten];
    const mergedRegular = [...regularProducts, ...newEaten];
    setEatenProducts(mergedEaten);
    setRegularProducts(mergedRegular);
    setNewProductsToAsk([]);
    await saveState({
      eatenProducts: mergedEaten,
      regularProducts: mergedRegular,
      occasionalProducts,
    });
    // Go to menu if we have one, else continue normal flow
    if (generatedMenu) {
      setScreen(6);
    } else if (selectedGoal) {
      setScreen(selectedGoal === "weight" && !kbju ? 4 : 5);
    } else {
      setScreen(3);
    }
  };

  // ---- Step completion handlers ----
  const handleStep1Complete = async (eaten) => {
    setEatenProducts(eaten);
    await saveState({ eatenProducts: eaten });
    setScreen(2);
  };

  const handleStep2Complete = async (reg, occ) => {
    setRegularProducts(reg);
    setOccasionalProducts(occ);
    await saveState({ regularProducts: reg, occasionalProducts: occ });
    setScreen(3);
  };

  const handleGoalSelect = async (goal) => {
    setSelectedGoal(goal);
    await saveState({ selectedGoal: goal });
    setScreen(goal === "weight" ? 4 : 41);
  };

  const handleKbjuSubmit = async (values) => {
    setKbju(values);
    await saveState({ kbju: values });
    setScreen(5);
  };

  const handleMenuReady = async (menu) => {
    setGeneratedMenu(menu);
    await saveState({ generatedMenu: menu });
    setScreen(6);
  };

  const handleEditProductsSave = async (result) => {
    // result = { eatenProducts, regularProducts, occasionalProducts }
    setEatenProducts(result.eatenProducts);
    setRegularProducts(result.regularProducts);
    setOccasionalProducts(result.occasionalProducts);
    await saveState(result);
    // Return to menu if exists, else continue normal flow
    if (generatedMenu) {
      setScreen(6);
    } else {
      setScreen(3);
    }
  };

  // ---- Render ----

  // Loading gate while checking storage
  if (screen === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: COLORS.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <GlobalStyles />
        <div
          style={{
            width: 32,
            height: 32,
            border: `3px solid ${COLORS.border}`,
            borderTopColor: COLORS.accent,
            borderRadius: "50%",
            animation: "spin 800ms linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg }}>
      <GlobalStyles />

      {screen === 0 && (
        <WelcomeScreen
          onStart={() => setScreen(1)}
          isMobile={isMobile}
          onDevSkip={devSkip}
        />
      )}

      {screen === 1 && (
        <Step1Screen
          key="step1"
          isMobile={isMobile}
          onComplete={handleStep1Complete}
        />
      )}

      {screen === 2 && (
        <Step2Screen
          key="step2"
          products={eatenProducts}
          isMobile={isMobile}
          onComplete={handleStep2Complete}
        />
      )}

      {screen === 3 && (
        <GoalScreen initial={selectedGoal} onSelect={handleGoalSelect} />
      )}

      {screen === 4 && (
        <KbjuScreen initial={kbju} onSubmit={handleKbjuSubmit} />
      )}

      {screen === 41 && (
        <EnergyConfirmScreen onNext={() => setScreen(5)} />
      )}

      {screen === 5 && (
        <LoadingScreen
          regularProducts={regularProducts}
          occasionalProducts={occasionalProducts}
          goal={selectedGoal}
          kbju={kbju}
          onComplete={handleMenuReady}
          onError={(err) => {
            setLastError(err);
            setScreen(51);
          }}
        />
      )}

      {screen === 51 && (
        <ErrorScreen
          error={lastError}
          onRetry={() => {
            setLastError(null);
            setScreen(5);
          }}
          onBackToStep2={() => {
            setLastError(null);
            setScreen(2);
          }}
        />
      )}

      {screen === 6 && (
        <MenuScreen
          menu={generatedMenu}
          onShoppingList={() => setScreen(7)}
          onRegenerate={regenerateMenu}
          onEditGoal={editGoal}
          onEditProducts={editProducts}
        />
      )}

      {screen === 7 && (
        <ShoppingListScreen
          menu={generatedMenu}
          allEatenProducts={eatenProducts}
          onReset={reset}
        />
      )}

      {screen === "editProducts" && (
        <EditProductsScreen
          eatenProducts={eatenProducts}
          regularProducts={regularProducts}
          occasionalProducts={occasionalProducts}
          onSave={handleEditProductsSave}
          onCancel={() => setScreen(generatedMenu ? 6 : 3)}
        />
      )}

      {screen === "diff" && (
        <ProductsDiffScreen
          newProducts={newProductsToAsk}
          isMobile={isMobile}
          onComplete={handleDiffComplete}
        />
      )}
    </div>
  );
}
