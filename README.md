# 🧾 Vue 3: E-RAČUNI JSON UPLOADER

---

### Pregled Projekta

Ovaj mini projekat služi kao lična vežba i učenje najboljih praksi u **Vue 3 (Composition API)** za obradu lokalnih podataka.

**Primarni cilj:** Omogućiti korisniku da direktno u pretraživaču, učita veliki JSON fajl sa e-računima (Eporezi / ESF) i prikaže njegov sadržaj u tabeli.

**Licenca:** Projekat je besplatan (open source) i otvoren za korišćenje u edukativne svrhe.

**Status:** Ovaj projekat je prvenstveno namenjen za učenje i vežbanje Vue 3 koncepata. Zbog toga nije namenjen za produkcionu upotrebu.

**Kooperacija:** Sve sugestije, predlozi za poboljšanje, korekcije koda ili kooperacija su dobrodošli! Slobodno otvorite Issue ili pošaljite Pull Request na GitHub repozitorijumu.

---

### Ključne Vue Karakteristike

Trudim se  da koristim sledeće **Vue** principe:

1.  **Vue 3 Composition API:** Koristimo **`<script setup>`** sintagmu za čist i čitljiv kod.
2.  **Composable Arhitektura:** Sva logika stanja i obrade podataka je izolovana u eksternom fajlu **`listaRacuna.js`** – ovo je ključno za odvajanje posla (logika) od prikaza (komponenta).
3.  **Reaktivnost:** Koristimo **`ref`** i **`computed`** za efikasno upravljanje stanjem.
4.  **Asinhrono Čitanje:** Koristi se **`FileReader` API** za neblokirajuće i sigurno učitavanje sadržaja JSON fajla sa korisničkog uređaja.
5.  **Template Refs:** Korišćenje **`ref="fileInput"`** za dobijanje direktnog pristupa DOM elementu `<input type="file">` iz Vue koda.

---

### Tehnologije

* **Vue 3 (Composition API)**
* **JavaScript (ES6+)**
* **HTML/CSS (Bootstrap administrativni template Tabler)**

---
 

### Pokretanje Projekta

Koraci za lokalno kloniranje i pokretanje projekta:

#### 1. Kloniranje Repozitorijuma
```bash
git clone [https://github.com/ifet4u/Vue-3-Pregled-Racuna.git](https://github.com/ifet4u/Vue-3-Pregled-Racuna.git)
cd Vue-3-Pregled-Racuna
```
#### 2. Instalacija zavisnih dodataka
```bash
npm install
# ili
yarn install
```
#### 3. Pokretanje
```bash
npm run dev
# ili
yarn dev 
```

Aplikacija će se pokrenuti na lokalnoj adresi (npr. http://localhost:5173/ )

<img width="774" height="331" alt="image" src="https://github.com/user-attachments/assets/54b8fa62-6eb3-470c-b457-390b8c552d54" />

<img width="747" height="512" alt="image" src="https://github.com/user-attachments/assets/2b6ba460-2a19-4ea0-ba66-256851522578" />

<img width="651" height="677" alt="image" src="https://github.com/user-attachments/assets/08324b5a-d938-4d67-8bc4-122173917754" />

