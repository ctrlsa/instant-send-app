const AboutPage = () => {
  return (
    <div>
      <h1>About</h1>
      <p>Version: {process.env.REACT_APP_VERSION}</p>
    </div>
  );
};

export default AboutPage;
