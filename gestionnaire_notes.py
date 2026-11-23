def analyser_notes(notes):
    moyenne = sum(notes.values()) / len(notes)
    meilleure = max(notes, key=notes.get)
    moins_bonne = min(notes, key=notes.get)
    return moyenne, meilleure, moins_bonne

notes = {}
nombre = int(input("Nombre de matières : "))
for i in range(nombre):
    matiere = input(f"Matière {i + 1} : ")
    note = float(input(f"Note de {matiere} (/20) : "))
    if not 0 <= note <= 20:
        print("Note invalide : saisissez une valeur entre 0 et 20.")
        continue
    notes[matiere] = note

if notes:
    moyenne, meilleure, moins_bonne = analyser_notes(notes)
    print(f"Moyenne : {moyenne:.2f}/20")
    print(f"Meilleure note : {meilleure} ({notes[meilleure]}/20)")
    print(f"Note la plus faible : {moins_bonne} ({notes[moins_bonne]}/20)")
else:
    print("Aucune note valide.")
