export const getArrayFromSnap = (snapshot) => {
  const array = [];
  snapshot.forEach((doc) => array.push(doc.data()));
  return array;
};
