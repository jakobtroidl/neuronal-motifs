export function getAuthToken() {
  const token = localStorage.getItem("token");
  // check if token is of type string
  if (typeof token === "string") {
    return token;
  }
  return "";
}

export function setAuthToken(e) {
  let token = e.target.value;
  localStorage.setItem("token", token);
}
