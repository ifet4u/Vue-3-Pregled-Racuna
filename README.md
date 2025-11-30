# 🧾 Vue 3: E-RAČUNI JSON UPLOADER

---

### 🚀 Pregled Projekta

Ovaj mini projekat služi kao vežba i demonstracija najboljih praksi u **Vue 3 (Composition API)** za obradu lokalnih podataka.

**Primarni cilj:** Omogućiti korisniku da sigurno, direktno u pretraživaču, učita veliki JSON fajl sa e-računima (Eporezi / ESF) i prikaže njegov sadržaj u tabeli.

---

### 💡 Ključne Vue Karakteristike

Projekat naglašava sledeće **Vue** principe:

1.  **Vue 3 Composition API:** Koristimo **`<script setup>`** sintagmu za čist i čitljiv kod.
2.  **Composable Arhitektura:** Sva logika stanja i obrade podataka je izolovana u eksternom fajlu **`listaRacuna.js`** – ovo je ključno za odvajanje posla (logika) od prikaza (komponenta).
3.  **Reaktivnost:** Koristimo **`ref`** i **`computed`** za efikasno upravljanje stanjem.
4.  **Asinhrono Čitanje:** Koristi se **`FileReader` API** za neblokirajuće i sigurno učitavanje sadržaja JSON fajla sa korisničkog uređaja.
5.  **Template Refs:** Korišćenje **`ref="fileInput"`** za dobijanje direktnog pristupa DOM elementu `<input type="file">` iz Vue koda.

---

### 🛠️ Tehnologije

* **Vue 3 (Composition API)**
* **JavaScript (ES6+)**
* **HTML/CSS (Bootstrap administrativni template Tabler)**

---

### 🚀 Pokretanje Projekta

1.  **Instalacija:**
    ```bash
    npm install
    # ili
    yarn install
    ```
2.  **Pokretanje:**
    ```bash
    npm run dev
    # ili
    yarn dev
    ```
---