import swal from "sweetalert";

export function flash(naslov,poruka,tip = 'success'){
  swal(naslov,poruka,tip);
}
