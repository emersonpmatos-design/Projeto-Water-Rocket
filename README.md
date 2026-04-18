# 🚀 AeroPET Pro: Simulador de Alta Precisão para Foguetes de Garrafa PET

![AeroPET Pro](https://picsum.photos/seed/rocket/1200/400)

O **AeroPET Pro** é um simulador balístico de foguetes de água (foguetes de garrafa PET) desenvolvido para oferecer resultados de alta fidelidade técnica em uma interface elegante e intuitiva. Ideal para estudantes, entusiastas de astronomia e experimentadores de foguetes experimentais.

## 🔬 Engenharia e Física do Projeto

Diferente de simuladores básicos, o AeroPET Pro utiliza modelos matemáticos avançados para prever a trajetória com precisão:

*   **Integração Numérica RK4**: Implementa o método de **Runge-Kutta de 4ª Ordem** para resolver as equações diferenciais de movimento, garantindo estabilidade e precisão em sistemas dinâmicos rápidos.
*   **Dinâmica de Fluidos Realista**:
    *   **Fase de Empuxo de Água**: Considera a conservação de energia e a equação de Bernoulli com coeficiente de descarga ($C_v = 0.97$) para perdas no bocal.
    *   **Fase de Empuxo de Ar**: Simula a expansão adiabática do ar e o fluxo crítico (choked flow) quando a pressão interna excede a pressão crítica.
*   **Modelo de Arrasto Atmosférico**: Cálculo em tempo real da força de arrasto baseada na densidade do ar e geometria da garrafa PET padrão.

## ✨ Principais Funcionalidades

*   **Ajuste Fino de Parâmetros**: Controle preciso de volume de água (ml), pressão de lançamento (psi) e ângulo de inclinação (deg).
*   **Presets de Lançamento**: Configurações rápidas baseadas em perfis reais (Balanced, High Velocity e Heavy Lift).
*   **Gráfico de Trajetória Dinâmico**: Visualização do perfil de voo com amostragem técnica.
*   **PWA Ready**: Otimizado para ser "instalado" diretamente no smartphone como um aplicativo nativo.
*   **Design Minimalista**: Interface focada na experiência do usuário (UX) inspirada em softwares de precisão.

## 🛠️ Tecnologias Utilizadas

*   **React 18** + **TypeScript**
*   **Vite** (Build Tool)
*   **Tailwind CSS** (Styling)
*   **Motion** (Animações de UI)
*   **Lucide React** (Ícones)

## 🚀 Como Rodar Localmente

Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/AeroPET-Pro.git
    cd AeroPET-Pro
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

4.  **Acesse no navegador:**
    ```
    http://localhost:3000
    ```

## 📱 Instalação no Celular (PWA)

Para rodar como um aplicativo nativo no seu Android ou iOS:
1.  Abra o link do projeto no navegador do celular.
2.  Vá em **"Adicionar à Tela de Início"** no menu do navegador.
3.  O AeroPET Pro aparecerá como um ícone na sua biblioteca de aplicativos.

## ⚖️ Licença

Este projeto está sob a licença **Apache-2.0**. Sinta-se à vontade para clonar, modificar e distribuir.

---
*Desenvolvido com precisão para quem sonha com as estrelas, começando no jardim.*
