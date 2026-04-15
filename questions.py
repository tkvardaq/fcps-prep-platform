import pandas as pd
import numpy as np
import random

categories = [
    "Obstetrics - Normal Pregnancy",
    "Obstetrics - High Risk Pregnancy"
]

difficulty_levels = [
    "Foundation",
    "Intermediate",
    "Advanced"
]

reference_books = [
    "SK22",
    "Radiant Notes",
    "Secrets Of FCPS"
]

question_bank = {
    "Obstetrics - Normal Pregnancy": [
        {
            "Question": "Average duration of third stage of labor?",
            "Option A": "5–10 minutes",
            "Option B": "10–20 minutes",
            "Option C": "20–30 minutes",
            "Option D": "30–40 minutes",
            "Correct Answer": "10–20 minutes",
            "Explanation": "Third stage usually lasts 10–20 minutes."
        }
    ],

    "Obstetrics - High Risk Pregnancy": [
        {
            "Question": "Most common cause of postpartum hemorrhage?",
            "Option A": "Uterine atony",
            "Option B": "Trauma",
            "Option C": "Coagulopathy",
            "Option D": "Retained placenta",
            "Correct Answer": "Uterine atony",
            "Explanation": "Uterine atony is the most common cause."
        }
    ]
}

data = []

for category in categories:
    for difficulty in difficulty_levels:

        for i in range(5):

            question_data = random.choice(
                question_bank[category]
            )

            data.append({
                "Subject": category.split(" - ")[0],
                "Topic": category.split(" - ")[1],
                "Paper Number": random.choice([1,2]),
                "Question": question_data["Question"],
                "Option A": question_data["Option A"],
                "Option B": question_data["Option B"],
                "Option C": question_data["Option C"],
                "Option D": question_data["Option D"],
                "Correct Answer": question_data["Correct Answer"],
                "Explanation": question_data["Explanation"],
                "Difficulty": difficulty,
                "Reference Book": random.choice(reference_books)
            })

df = pd.DataFrame(data)

df.to_csv(
    "fcps_part1_gyne_mcqs_sample.csv",
    index=False
)

print("CSV created successfully")