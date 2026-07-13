export default interface Favorito {
  _id: string;
  userId: string;
  businessId: {
    _id: string;
    name: string;
    category: string;
    location: any;
  } | null;
}
