import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Camera } from "lucide-react";

async function updateUser(updates: { profileImageUrl?: string; firstName?: string; lastName?: string }) {
  try {
    console.log("[CLIENT] Sending update request with:", updates);
    
    const response = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    });

    console.log("[CLIENT] Response status:", response.status);
    console.log("[CLIENT] Response Content-Type:", response.headers.get("content-type"));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[CLIENT] Error response:", errorText);
      throw new Error(`Falha ao atualizar perfil: ${response.status}`);
    }

    // Tenta fazer parse direto como JSON
    try {
      const data = await response.json();
      console.log("[CLIENT] Parsed JSON successfully:", data);
      return data;
    } catch (jsonError) {
      console.error("[CLIENT] Failed to parse JSON:", jsonError);
      
      // Se falhar, tenta ler como texto para ver o que foi retornado
      const text = await response.clone().text();
      console.error("[CLIENT] Response body as text:", text);
      console.error("[CLIENT] Response body length:", text.length);
      
      // Se a resposta estiver vazia, retorna sucesso vazio
      if (!text || text.trim() === '') {
        console.warn("[CLIENT] Empty response, assuming success");
        // Retorna os dados que já temos
        return updates;
      }
      
      throw new Error("Resposta inválida do servidor");
    }
  } catch (error) {
    console.error("[CLIENT] Request error:", error);
    throw error;
  }
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || "");
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (data: any) => {
      console.log("Update successful, data received:", data);
      
      // Se a resposta tem o campo user, usa ele; senão usa data diretamente
      const userData = data.user || data;
      
      // Atualiza o cache do React Query com os novos dados
      if (userData && userData.id) {
        queryClient.setQueryData(["/api/auth/user"], userData);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
      
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates: any = {};
    if (profileImageUrl.trim()) updates.profileImageUrl = profileImageUrl.trim();
    if (firstName.trim()) updates.firstName = firstName.trim();
    if (lastName.trim()) updates.lastName = lastName.trim();
    
    updateMutation.mutate(updates);
  };

  return (
    <div className="space-y-8 animate-slide-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground mt-2">Gerencie suas informações pessoais</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Preview */}
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                  {firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{firstName} {lastName}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Profile Image URL */}
            <div className="space-y-2">
              <Label htmlFor="profileImageUrl">
                <Camera className="w-4 h-4 inline mr-2" />
                URL da Foto de Perfil
              </Label>
              <Input
                id="profileImageUrl"
                type="url"
                placeholder="https://exemplo.com/minha-foto.jpg"
                value={profileImageUrl}
                onChange={(e) => setProfileImageUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Cole a URL de uma imagem para usar como foto de perfil
              </p>
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">
                <User className="w-4 h-4 inline mr-2" />
                Nome
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Seu nome"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Seu sobrenome"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
