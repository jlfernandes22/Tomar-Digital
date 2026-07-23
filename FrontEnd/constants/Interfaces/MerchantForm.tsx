export default interface IComercianteForm {
  tituloComercio: string;
  donoComercio: string;
  emailDono: string;
  telefoneDono: string;
  documentoPDF: { uri: string; name: string } | null;
}
