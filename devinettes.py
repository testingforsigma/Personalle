import random

secret = random.randint(1, 100)
essais = 0
print("Devinez le nombre entre 1 et 100.")
while True:
    try:
        proposition = int(input("Votre proposition : "))
        essais += 1
        if proposition < secret:
            print("Trop petit !")
        elif proposition > secret:
            print("Trop grand !")
        else:
            print(f"Bravo ! Trouvé en {essais} essai(s).")
            break
    except ValueError:
        print("Entrez un nombre entier.")
