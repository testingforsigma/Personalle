def calculer(a, operateur, b):
    if operateur == "+": return a + b
    if operateur == "-": return a - b
    if operateur == "*": return a * b
    if operateur == "/":
        if b == 0: raise ZeroDivisionError("division par zéro")
        return a / b
    raise ValueError("opérateur inconnu")

try:
    a = float(input("Premier nombre : "))
    op = input("Opération (+, -, *, /) : ")
    b = float(input("Deuxième nombre : "))
    print("Résultat :", calculer(a, op, b))
except ValueError as erreur:
    print("Erreur :", erreur)
except ZeroDivisionError as erreur:
    print("Erreur :", erreur)
