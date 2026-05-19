export default interface NegocioInterface {
  _id: string;
  owner: string;
  name: string;
  category: string;
  location: {
    lat: number;
    long: number;
  };
  address: string;
  status: string;
  NIF?: number | null;
  email?: string;
}
