class Welcome extends Phaser.Scene {
    constructor() {
        super({ key: 'Welcome' });
    }

    preload() {
        // Carregar assets necessários para a cena Welcome
        this.load.image('background', 'assets/kitchenimage.jpg');
    }

    create() {
        // Exibir fundo
        this.add.image(400, 300, 'background');

        // Texto de boas-vindas com sombra e borda
        this.add.text(400, 150, 'Cook-off\nShowdown', {
            fontSize: '64px',
            color: '#ffffff',
            stroke: '#000000',  // Borda preta
            strokeThickness: 5, // Espessura da borda
            shadow: {
                offsetX: 3,       // Deslocamento da sombra na horizontal
                offsetY: 3,       // Deslocamento da sombra na vertical
                blur: 5,          // Difusão da sombra
                color: '#000000', // Cor da sombra
                alpha: 0.7        // Transparência da sombra
            },
            align: 'center',    // Alinha o texto no centro
            wordWrap: { width: 600, useAdvancedWrap: true }  // Define a largura máxima para o texto
        }).setOrigin(0.5, 0.5);

        // Texto explicativo abaixo de "Bem-vindo"
        this.add.text(400, 265, 'Bem-vindo(a) à sua\nnova cozinha!', {
            fontSize: '38px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                blur: 4,
                color: '#000000',
                alpha: 0.6       
            },
            align: 'center',    
            wordWrap: { width: 600, useAdvancedWrap: true }  
        }).setOrigin(0.5, 0.5);

        // Botão "Iniciar Jogo"
        const startButton = this.add.text(400, 360, 'Iniciar Jogo', {
            fontSize: '38px',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3
        })
        .setOrigin(0.5, 0.5)
        .setInteractive();

        // Evento de clique no botão "Iniciar Jogo"
        startButton.on('pointerdown', () => {
            this.scene.start('Kitchen'); // Inicia a cena principal
        });

        // Botão "Como Jogar"
        const howToPlayButton = this.add.text(400, 430, 'Como Jogar', {
            fontSize: '36px',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 3
        })
        .setOrigin(0.5, 0.5)
        .setInteractive();

        // Evento de clique no botão "Como Jogar"
        howToPlayButton.on('pointerdown', () => {
            this.showHowToPlay(); // Mostra a explicação de como jogar
        });
    }

    showHowToPlay() {
        // Fundo preto semitransparente para o tutorial
        const blackOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        blackOverlay.setOrigin(0.5, 0.5); // Centraliza o fundo preto

        // Caixa de texto com fundo semi-transparente
        const instructionBox = this.add.graphics();
        instructionBox.fillStyle(0x000000, 0.7); // Cor de fundo semi-transparente

        // Ajustar a posição para centralizar
        const boxWidth = 650;
        const boxHeight = 400;
        const centerX = 400;  // Posição X central
        const centerY = 300;  // Posição Y central

        instructionBox.fillRect(centerX - boxWidth / 2, centerY - boxHeight / 2, boxWidth, boxHeight);

        // Texto explicando como jogar
        const instructions = `
- Objetivo: Sirva os clientes corretamente\ne ganhe pontos!

- Controles:
  * Setas ← →: Movem o personagem
  * Seta ↑: Pula
  * Pegue a comida e leve até o cliente.
  
- Atenção: Cada cliente quer uma comida específica.
`;

        const instructionsText = this.add.text(400, 250, instructions, {
            fontSize: '20px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 700 },
            stroke: '#000000', 
            strokeThickness: 3,
            shadow: {
                offsetX: 3,
                offsetY: 3,
                blur: 5,
                color: '#000000',
                alpha: 0.7
            }
        }).setOrigin(0.5, 0.5);

        // Botão para fechar o tutorial
        const backButton = this.add.text(400, 400, 'Voltar', {
            fontSize: '28px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 3
        })
        .setOrigin(0.5, 0.5)
        .setInteractive();

        // Evento de clique no botão "Voltar"
        backButton.on('pointerdown', () => {
            blackOverlay.destroy(); // Remove o fundo
            instructionBox.destroy(); // Remove a caixa de texto
            instructionsText.destroy(); // Remove as instruções
            backButton.destroy(); // Remove o botão de voltar
        });
    }
}
