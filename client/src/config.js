const production = {
    API_URL: process.env.REACT_APP_API_URL,
};

const development = {
    API_URL: process.env.REACT_APP_API_URL,
};

export const config = process.env.NODE_ENV === 'production' ? production : development;