import {computed, ref} from "vue";
const listaRacuna = ref([]);
const praznaListaRacuna = computed(() =>{
    return listaRacuna.value.length === 0;
})
const errorLoadingRacuna = ref(null);
const loadRacuni = ref(null);

const obrisiListuRacuna = () => {
    confirm("Da li ste sigurni da želite obrisati listu računa?") ?
    listaRacuna.value = [] : null;
}

const uploadjujFajl = (fileInput) => { // Uklanjamo (event) jer citamo iz ref-a

  // **ISPRAVKA 1b:** Citamo fajl direktno iz ref-a (fileInput)
  const file = fileInput.value.files[0];

  listaRacuna.value = [];
  errorLoadingRacuna.value = null;

  if (!file){
    errorLoadingRacuna.value = "Nije izabran nijedan fajl";
    return;
  }
  if (file.type !== "application/json"){
    errorLoadingRacuna.value = "Fajl nije u JSON formatu";
    return;
  }

  loadRacuni.value = true;
  const reader = new FileReader();

  // **ISPRAVKA 2a:** Postavljamo onerror pre citanja
  reader.onerror = (e) => {
    loadRacuni.value = false;
    errorLoadingRacuna.value = "Greska pri ucitavanju fajla: " + e.target.error;
  };

  reader.onload= (e) =>
  {
    loadRacuni.value = false;
    const fileContent = e.target.result;

    //pokusaj parsiranja JSON-a
    try {
      const parsedData = JSON.parse(fileContent);
      if (Array.isArray(parsedData)){
        listaRacuna.value = parsedData;
      } else {
        errorLoadingRacuna.value = "Fajl ne sadrzi niz racuna";
      }
    } catch (error) {
      errorLoadingRacuna.value = "Greska pri parsiranju JSON-a: " + error.message;
    }
  }

  reader.readAsText(file);
};
export { listaRacuna,praznaListaRacuna, errorLoadingRacuna, loadRacuni,uploadjujFajl, obrisiListuRacuna };
