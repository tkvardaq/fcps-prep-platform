import pandas as pd
import os
import uuid

# Subject and Topic mappings
SUBJECT_ID = "bcb4ceb9-4528-4cf5-b17c-b4c6dcf3aa8a"
TOPIC_MAPPING = {
    "Drugs in Pregnancy": "4b5ebfb9-5621-479e-aa30-133b37a13f6a",
    "Teratogenicity": "de93d607-0885-40db-8ea8-4f7dac6ca929",
    "Oxytocics": "121f89ce-09d1-4dfc-abdc-c06378906554",
    "Antenatal Care": "5529aa38-b1b2-4e37-81b0-25adee7c6a1f",
    "Physiological Changes in Pregnancy": "4a44eece-ce99-402f-a2a1-aa7b46412010",
    "Maternal Nutrition": "7230848c-9716-4030-96f8-6bf5a9f80b89",
    "Cervical Cancer": "b8124174-26b7-424a-bb7d-b16b37969ae0",
    "Ovarian Tumors": "34f1ce02-6e43-443a-a782-b11941c288de",
    "Endometrial Hyperplasia": "e9dc3eb7-b0e0-4381-8320-2d5023ffae49",
    "Pre-eclampsia": "1333a5dc-90c0-4ce1-b6e8-ea7d6dcdfb86",
    "Eclampsia": "582bfb86-244b-48a2-82b6-57e6fcc7bcf4",
    "Gestational Hypertension": "800a72b9-6997-4483-a670-2669adb079b4",
    "HELLP Syndrome": "fb5b468c-be2f-48f1-ba6a-80efa919babe",
    "Biostatistics": "3095c076-fa71-48f9-8952-eabcf97cf299",
    "Diabetes in Pregnancy": "24c7ef13-e21b-4af0-82f5-f1db8c646eef",
    "Heart Disease in Pregnancy": "e8c8f252-022d-49d3-a194-c9b9591bf061",
    "Anemia in Pregnancy": "2432ddb0-e30d-4543-a4c5-ed1a59d0b337",
    "Antepartum Hemorrhage": "537cfbe7-fa49-48bb-b147-7e12bae773a0",
    "Abruptio Placentae": "6f8ccb53-a4d7-4f43-af0e-f94e57745850",
    "Placenta Previa": "f1d6ad8c-2b8a-4c4c-9aee-b955c8d8457e",
    "Multiple Pregnancy": "4f118a82-d8f2-4018-a50a-6072d09ff145",
    "Preterm Labor": "07ee0723-fd7d-4763-ac81-9b320b9707f7",
    "Premature Rupture of Membranes": "e473b792-4e75-4aa9-8e18-1fe2a4e9621a",
    "Fetal Growth Restriction": "8f9959d7-cb82-4988-a157-1df92b720ef9",
    "Fetal Monitoring": "3d6faad1-ad3a-4f62-aa90-9f959eb7c89a",
    "Biophysical Profile": "e1333100-dea7-49d5-ad3e-f98aab0122db",
    "Mechanism of Normal Labor": "24655e25-1033-4b73-9161-3b7fc0079115",
    "Induction of Labor": "75cc659c-4077-4c87-a34e-77098d401e38",
    "Malpresentations": "2fa4a00b-9efa-435e-920a-b1879b08b797",
    "Postpartum Hemorrhage": "859f46ce-dd19-4f16-968c-601d087d3d71",
    "Puerperium": "690e452c-db42-4f08-8cb8-696b0201f06c",
    "Lactation": "a4a0dcc5-b2ac-4f6b-8cf5-9a81117182d7",
    "Mastitis": "34cb726a-a585-422e-be80-454e04448fc0",
    "Obstetric Operations": "b872f8b6-d6c8-43b9-80d9-ac7efcc78501",
    "Cesarean Section": "3f991ae6-f5e5-45c0-bcae-defa605d140e",
    "Instrumental Deliveries": "2d027121-c204-4f16-9ede-8feaa2558e26",
    "Neonatal Resuscitation": "e22623a2-f82c-4acf-ac5b-993227ec2209",
    "Newborn Examination": "9a2eaa45-0d19-4a96-ac38-070981dc66ac",
    "Jaundice": "809d4ca9-b26e-4faa-8138-42113bd0e575",
    "Menstrual Cycle": "17bcadf7-e881-408b-b6b7-9e22559bdf3d",
    "Puberty": "5edf163b-3974-44a6-80da-9bf3e59e59e0",
    "Amenorrhea": "cc93c13c-33cb-445d-9df8-ff1a36d3ab46"
}

CSV_FILE = "fcps_mcqs_final.csv"
OUTPUT_DIR = "scratch"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def escape_sql(text):
    if pd.isna(text) or text is None:
        return 'NULL'
    text = str(text).strip()
    # Handle single quotes for SQL
    return text.replace("'", "''")

def process_csv():
    # Use pandas for robust parsing
    df = pd.read_csv(CSV_FILE)
    
    rows = []
    missing_topics = set()
    count = 0
    
    for _, row in df.iterrows():
        topic_name = str(row['Topic']).strip()
        topic_id = TOPIC_MAPPING.get(topic_name)
        
        if not topic_id:
            if topic_name and topic_name != 'nan':
                missing_topics.add(topic_name)
            continue
            
        paper_num = str(row['Paper Number']).strip()
        if paper_num == 'nan' or not paper_num:
            paper_num = '1'
            
        difficulty = str(row['Difficulty']).lower().strip()
        diff_map = {
            'easy': 'easy', 'medium': 'medium', 'moderate': 'medium',
            'hard': 'hard', 'difficult': 'hard'
        }
        difficulty = diff_map.get(difficulty, 'medium')
        
        ref_book = row['Reference Book']
        if pd.isna(ref_book):
            ref_book = 'Ten Teachers'
            
        explanation = row['Explanation']
        if pd.isna(explanation):
            explanation = ''
            
        vals = (
            f"('{SUBJECT_ID}', "
            f"'{topic_id}', "
            f"{paper_num}, "
            f"'{escape_sql(row['Question'])}', "
            f"'{escape_sql(row['Option A'])}', "
            f"'{escape_sql(row['Option B'])}', "
            f"'{escape_sql(row['Option C'])}', "
            f"'{escape_sql(row['Option D'])}', "
            f"'{escape_sql(row['Correct Answer'])}', "
            f"'{escape_sql(explanation)}', "
            f"'{escape_sql(ref_book)}', "
            f"'{difficulty}', "
            f"true)"
        )
        rows.append(vals)
        count += 1
                
    print(f"Processed {count} valid MCQs.")
    if missing_topics:
        print(f"Missing mappings for topics: {missing_topics}")

    if rows:
        batch_size = 50
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i + batch_size]
            sql_stmt = (
                "INSERT INTO public.mcqs "
                "(subject_id, topic_id, paper_number, question, option_a, option_b, option_c, option_d, "
                "correct_answer, explanation, reference_book, difficulty, is_published) "
                "VALUES\n" + ",\n".join(batch) + ";"
            )
            
            output_file = os.path.join(OUTPUT_DIR, f"mcq_batch_{i}.sql")
            with open(output_file, mode='w', encoding='utf-8') as f:
                f.write(sql_stmt)
        print(f"Generated batches in {OUTPUT_DIR}")

if __name__ == "__main__":
    process_csv()
