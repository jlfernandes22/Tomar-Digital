export default interface NegocioInterface {
  _id: string;
  owner: string;
  name: string;
  category: string;
  logo?: string;
  description?: string;
  gallery?: string[];
  location: {
    lat: number;
    long: number;
  };
  address: string;
  status: string;
  NIF?: number | null;
  email?: string;
}
