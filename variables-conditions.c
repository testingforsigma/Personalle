#include <stdio.h>
int main(void) {
    float note;
    printf("Saisir une note sur 20 : ");
    if (scanf("%f", &note) != 1 || note < 0 || note > 20) {
        printf("Note invalide.\n");
        return 1;
    }
    if (note >= 10) printf("Résultat : admis.\n");
    else printf("Résultat : non admis.\n");
    return 0;
}
