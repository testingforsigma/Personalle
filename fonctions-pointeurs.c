#include <stdio.h>
void echanger(int *a, int *b) {
    int temporaire = *a;
    *a = *b;
    *b = temporaire;
}
int main(void) {
    int x = 12, y = 5;
    printf("Avant : x=%d, y=%d\n", x, y);
    echanger(&x, &y);
    printf("Après : x=%d, y=%d\n", x, y);
    return 0;
}
