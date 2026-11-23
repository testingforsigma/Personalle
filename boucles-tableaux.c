#include <stdio.h>
int main(void) {
    int valeurs[] = {4, 8, 2, 10, 6};
    int n = sizeof(valeurs) / sizeof(valeurs[0]);
    int somme = 0;
    for (int i = 0; i < n; i++) somme += valeurs[i];
    printf("Somme = %d\n", somme);
    printf("Moyenne = %.2f\n", (float)somme / n);
    return 0;
}
