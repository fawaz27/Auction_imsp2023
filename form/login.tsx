import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "../ui/use-toast";
import { LoginDto } from "../domain/dto/login.dto";
import AuthService from "../domain/services/auth.service";

function Login() {
  const { toast } = useToast();
  const [emailField, setEmailField] = useState("");
  const [passwordField, setPasswordField] = useState("");
  const toastType = ["Error", "Warning", "Info"];

  const [isLoading, setIsloading] = useState(false);
  const disabled = useMemo(() => {
    return emailField === "" || passwordField === "";
  }, [emailField, passwordField]);

  async function handleSubmit(e: any): Promise<void> {
    e.preventDefault();
    setIsloading(() => true);

    const dto: LoginDto = {
      email: emailField,
      password: passwordField,
    };

    const response = await AuthService.login(dto);

    if (response.success) {
      toast({
        title: "Success",
        description: `Connexion réussie`,
      });
    } else {
      toast({
        title: "Error",
        description: `${response.message}`,
      });
    }
    setIsloading(false);
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen ">
      <div className="bg-white rounded-lg shadow-lg p-8 w-96 h-96">
        <div className="text-primary flex flex-col justify-center items-center h-full gap-6 max-w-60">
          <h2 className="text-3xl font-bold">Se connecter</h2>
          <div className="flex flex-col items-center gap-4">
            <div className="w-full">
              <Input
                type="email"
                placeholder="Email"
                value={emailField}
                onChange={(e) => setEmailField(e.target.value)}
              />
            </div>
            <div className="w-full">
              <Input
                type="password"
                placeholder="Mot de passe"
                value={passwordField}
                onChange={(e) => setPasswordField(e.target.value)}
              />
              <a className="float-right" href="#">
                mot de passe oublié ?
              </a>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Button
                isLoading={isLoading}
                disabled={disabled}
                onClick={handleSubmit}
                type="submit"
                className="w-2/3"
              >
                Se connecter
              </Button>
              <span>
                Vous n'avez pas de compte ?{" "}
                <a className="ml-2" href="/inscription">
                  S'inscrire
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
