interface User {
  id: string;
  username: string | undefined;
  name: string;
}

async function hashFunction(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function login(user: User, password: string): Promise<boolean> {
  try {
    const storedHash = localStorage.getItem(`user_${user.id}`);
    if (!storedHash) {
      return false;
    }
    const inputHash = await hashFunction(password);
    return storedHash === inputHash;
  } catch (error) {
    console.error("Login failed:", error);
    return false;
  }
}

export async function createPassword(
  user: User,
  password: string
): Promise<boolean> {
  try {
    const hash = await hashFunction(password);
    localStorage.setItem(`user_${user.id}`, hash);
    return true;
  } catch (error) {
    console.error("Password creation failed:", error);
    return false;
  }
}

export async function checkPasswordExists(userId: string): Promise<boolean> {
  try {
    const storedHash = localStorage.getItem(`user_${userId}`);
    return !!storedHash;
  } catch (error) {
    console.error("Password check failed:", error);
    return false;
  }
}
