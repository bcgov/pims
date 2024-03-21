const urls = {
  GEOCODER: {
    HOSTURI: 'https://geocoder.api.gov.bc.ca',
  },
  CHES: {
    AUTH: process.env.CHES_AUTH_URL,
    HOST: process.env.CHES_HOST_URI,
  },
};
export default urls;
