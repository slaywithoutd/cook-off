class Kitchen extends Phaser.Scene {
    constructor() {
        super({ key: 'Kitchen' });
        this.firstFoodCollectionAllowed = false; // Indica se a coleta de comida é permitida
        this.foodCooldown = 2000; // Tempo de respawn de comida em milissegundos
        this.clientCooldown = 5000; // Tempo de respawn dos clientes em milissegundos
    }

    preload() {
        // Carregar imagens e sprites que serão usadas no jogo
        this.load.image('kitchenBackground', 'assets/background.jpg');
        this.load.image('cabinet', 'assets/kitchencabinet.png');
        this.load.image('table', 'assets/table.png');
        this.load.spritesheet('chef', 'assets/chef3.png', { frameWidth: 32, frameHeight: 48 });
    }

    create() {
        // Configurar o fundo da cozinha
        const background = this.add.image(0, 0, 'kitchenBackground').setTint(0xFFB3A7);
        background.setOrigin(0, 0);
        background.setDisplaySize(this.game.config.width, this.game.config.height);

        // Configurar plataformas (armários) onde a comida aparecerá
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 680, 'cabinet').setScale(0.6).refreshBody().setTint(0x333333);
        this.platforms.create(690, 285, 'cabinet').setScale(0.15).refreshBody();
        this.platforms.create(100, 285, 'cabinet').setScale(0.15).refreshBody();
        this.platforms.create(400, 170, 'cabinet').setScale(0.15).refreshBody();
        this.platforms.create(400, 400, 'cabinet').setScale(0.15).refreshBody();

        // Configurar jogador (chef)
        this.player = this.physics.add.sprite(200, 450, 'chef');
        this.player.setBounce(0.2); // Define o quão "saltitante" o jogador é
        this.player.setCollideWorldBounds(true); // Impede que o jogador saia dos limites do jogo

        // Configurar mesa onde a comida pode ser colocada
        this.table = this.physics.add.image(50, this.scale.height - 60, 'table');
        this.table.setOrigin(0.5, 1);
        this.table.setScale(0.05);
        this.table.setImmovable(true); // A mesa não se move
        this.table.body.setAllowGravity(false); // A mesa não é afetada pela gravidade
        this.physics.add.collider(this.player, this.table); // Permite colisão entre jogador e mesa

        // Configurar animações do jogador
        this.anims.create({
            key: 'walk-left',
            frames: this.anims.generateFrameNumbers('chef', { start: 5, end: 2 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers('chef', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [{ key: 'chef', frame: 5 }],
            frameRate: 20
        });

        // Configurar controles do jogador
        this.cursors = this.input.keyboard.createCursorKeys();
        this.physics.add.collider(this.player, this.platforms);

        // Configurar comidas que aparecerão no jogo
        this.foods = ['🍕', '🍔', '🍟', '🍩', '🥗'];
        this.foodsFollowingPlayer = []; // Lista de comidas que seguem o jogador

        // Criar comida nas plataformas
        this.createFoodOnPlatform(690, 285);
        this.createFoodOnPlatform(100, 285);
        this.createFoodOnPlatform(400, 170);
        this.createFoodOnPlatform(400, 400);

        // Criar clientes na plataforma
        this.createClient(400, 650);

        // Criar lixeira onde a comida pode ser descartada
        this.trashBin = this.add.text(this.game.config.width - 50, this.game.config.height - 80, '🗑️', { fontSize: '32px' });
        this.trashBin.setOrigin(0.5, 0.5);
        this.physics.add.existing(this.trashBin);
        this.trashBin.body.setAllowGravity(false);
        this.trashBin.body.setImmovable(true);
        this.physics.add.overlap(this.player, this.trashBin, this.deleteFood, null, this);

        // Permitir coleta de comida após um pequeno atraso
        setTimeout(() => {
            this.firstFoodCollectionAllowed = true;
        }, 500);

        // Configuração inicial da cena
        this.score = 0; // Inicializa a pontuação
        this.scoreText = this.add.text(16, 16, 'Pontuação: 0', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333'
        });

        this.timer = 61; // Tempo inicial do timer (em segundos)
        this.timerText = this.add.text(16, 50, `Tempo: ${this.timer} s`, {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333'
        });

        // Iniciar o Timer com um While assíncrono
        this.startTimer();

        // Reduz o Timer a cada segundo
        this.time.addEvent({
            delay: 1000, // Intervalo de 1 segundo
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        // Atualiza o texto da pontuação sempre que ela muda
        this.events.on('update-score', () => {
            this.scoreText.setText(`Pontuação: ${this.score}`);
        });
    }

    createFoodOnPlatform(x, y) {
        // Escolhe uma comida aleatória da lista
        const randomFood = Phaser.Math.RND.pick(this.foods);
        // Cria um texto representando a comida na posição especificada
        const food = this.add.text(x, y - 50, randomFood, { fontSize: '32px' });
        food.setOrigin(0.5, 0.5);
        this.physics.add.existing(food);
        food.body.setAllowGravity(false);

        // Quando o jogador se aproxima da plataforma, a comida começa a seguir
        this.physics.add.overlap(this.player, food, () => this.collectFood(food), null, this);
    }

    createClient(x, y) {
        // Limita o número de clientes simultâneos a 4
        if (this.clients && this.clients.length >= 4) {
            return;
        }

        // Escolhe um emoji de cliente aleatório
        const clientEmojis = ['🐶', '🐱', '🐰', '🦊'];
        const randomClient = Phaser.Math.RND.pick(clientEmojis);

        // Cria um texto representando o cliente na posição especificada
        const client = this.add.text(x, y - 160, randomClient, { fontSize: '32px' });
        client.setOrigin(0.5, 0.5);
        this.physics.add.existing(client);
        client.body.setAllowGravity(false);

        // Escolhe uma comida aleatória que o cliente deseja
        const desiredFood = Phaser.Math.RND.pick(this.foods);
        // Cria um texto indicando a comida desejada pelo cliente
        const clientText = this.add.text(x, y - 70, `${randomClient} quer ${desiredFood}`, { fontSize: '20px', color: '#ffffff' });
        clientText.setOrigin(0.5, 0.5);

        // Lista para controlar clientes ativos
        if (!this.clients) {
            this.clients = [];
        }
        this.clients.push({ client, clientText, desiredFood });

        // Adiciona lógica para servir o cliente e pontuar
        this.physics.add.overlap(this.player, client, () => {
            if (this.foodsFollowingPlayer.length > 0) {
                const servedFood = this.foodsFollowingPlayer.pop(); // Remove a comida servida
                if (servedFood.text === desiredFood) {
                    // Cliente servido corretamente
                    this.score += 10; // Incrementa a pontuação
                } else {
                    // Cliente servido com comida errada
                    this.score -= 5; // Decrementa a pontuação
                }
                servedFood.destroy(); // Remove a comida do jogo
                client.destroy();
                clientText.destroy();
                this.clients = this.clients.filter(c => c.client !== client); // Remove cliente da lista

                // Respawn de novo cliente após um intervalo
                setTimeout(() => {
                    this.createClient(x, y);
                }, this.clientCooldown);
            }
        }, null, this);
    }

    spawnNewFoodOnPlatform(previousFoodX, previousFoodY) {
        // Respawn da comida após um intervalo
        setTimeout(() => {
            const newFood = Phaser.Math.RND.pick(this.foods);

            // Garante que a nova comida spawne na posição exata da comida anterior
            const foodText = this.add.text(previousFoodX, previousFoodY, newFood, { fontSize: '24px' });
            foodText.setOrigin(0.5, 0.5);
            this.physics.add.existing(foodText);
            foodText.body.setAllowGravity(false);

            // Adiciona a comida à plataforma novamente
            this.physics.add.overlap(this.player, foodText, () => this.collectFood(foodText), null, this);
        }, this.foodCooldown);
    }

    collectFood(food) {
        // Verifica se a coleta de comida é permitida
        if (this.firstFoodCollectionAllowed) {
            // Verifica se não há outras comidas seguindo o jogador
            if (this.foodsFollowingPlayer.length === 0) {
                // Captura as coordenadas da comida coletada para respawn
                const { x: foodX, y: foodY } = food;

                // Adiciona a comida à lista de comidas que seguem o jogador
                this.foodsFollowingPlayer.push(food);

                // Ajusta propriedades para indicar que está seguindo o jogador
                food.body.enable = false; // Desativa as colisões físicas
                food.setAlpha(0.5); // Reduz a opacidade para indicar que está "em uso"

                // Respawn da comida usando a posição da coletada
                this.spawnNewFoodOnPlatform(foodX, foodY);
            }
        }
    }

    deleteFood(player, trashBin) {
        // Verifica se há comidas seguindo o jogador
        if (this.foodsFollowingPlayer.length > 0) {
            const food = this.foodsFollowingPlayer.pop();
            food.destroy(); // Remove a comida do jogo
            this.score -= 1; // Decrementa a pontuação ao jogar comida no lixo
            this.scoreText.setText(`Pontuação: ${this.score}`); // Atualiza a pontuação na tela
        }
    }

    checkPlayerNearTable() {
        // Calcula a distância entre o jogador e a mesa
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.table.x, this.table.y);
        return distance < 50; // Retorna verdadeiro se a distância for menor que 50
    }

    placeFoodOnTable() {
        // Coloca a comida na mesa
        this.table.food = this.food;
        this.food.setPosition(this.table.x, this.table.y - 20);
        this.food = null;
    }

    pickUpFoodFromTable() {
        // Pega a comida da mesa
        this.food = this.table.food;
        this.table.food = null;
    }

    async startTimer() {
        // Loop que decrementa o timer a cada segundo
        while (this.timer > 0) {
            this.timer--; // Decrementa o timer
            this.timerText.setText(`Tempo: ${this.timer}`); // Atualiza o texto na tela
            await this.sleep(1000); // Aguarda 1 segundo
        }

        // Quando o tempo chega a 0, o jogo pausa
        this.physics.pause(); // Pausa todas as interações físicas
        this.cursors.left.reset(); // Reseta as entradas
        this.cursors.right.reset();
        this.cursors.up.reset();

        // Escurece a tela
        const blackOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        blackOverlay.setOrigin(0.5, 0.5);

        // Exibe "GAME OVER"
        this.add.text(400, 200, 'GAME OVER', { fontSize: '48px', color: '#ff0000' }).setOrigin(0.5, 0.5);

        // Exibe a pontuação final
        this.add.text(400, 280, `Sua Pontuação: ${this.score}`, { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5, 0.5);

        // Adiciona botão para reiniciar o jogo
        const restartButton = this.add.text(400, 360, 'Reiniciar', { fontSize: '28px', color: '#00ff00' })
            .setOrigin(0.5, 0.5)
            .setInteractive();

        restartButton.on('pointerdown', () => {
            this.scene.restart(); // Reinicia a cena atual
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    update() {
        // Verifica se a tecla esquerda está pressionada
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160); // Move o jogador para a esquerda
            this.player.anims.play('walk-left', true); // Toca a animação de andar para a esquerda
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160); // Move o jogador para a direita
            this.player.anims.play('walk-right', true); // Toca a animação de andar para a direita
        } else {
            this.player.setVelocityX(0); // Para o jogador
            this.player.anims.play('turn', true); // Toca a animação de parada
        }

        // Verifica se a tecla para cima está pressionada e o jogador está no chão
        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330); // Faz o jogador pular
        }

        // Atualiza o texto da pontuação na tela
        this.scoreText.setText(`Pontuação: ${this.score}`);

        // Atualizar a pontuação visualmente
        this.events.emit('update-score');

        // Atualizar a posição das comidas que seguem o jogador
        this.foodsFollowingPlayer.forEach((food, index) => {
            const targetX = this.player.x + (index * 15);
            const targetY = this.player.y - 30;
            food.x = Phaser.Math.Linear(food.x, targetX, 0.2);
            food.y = Phaser.Math.Linear(food.y, targetY, 0.2);
        });

        // Verifica se o jogador está perto da mesa
        if (this.checkPlayerNearTable()) {
            if (this.food && !this.table.food) {
                this.placeFoodOnTable(); // Coloca a comida na mesa
            } else if (!this.food && this.table.food) {
                this.pickUpFoodFromTable(); // Pega a comida da mesa
            }
        }

        // Verifica se o timer ainda está ativo
        if (this.timer > 0) {
            // Permite movimentação enquanto o timer não acabou
            if (this.cursors.left.isDown) {
                this.player.setVelocityX(-160);
                this.player.anims.play('walk-left', true);
            } else if (this.cursors.right.isDown) {
                this.player.setVelocityX(160);
                this.player.anims.play('walk-right', true);
            } else {
                this.player.setVelocityX(0);
                this.player.anims.stop();
            }

            if (this.cursors.up.isDown && this.player.body.touching.down) {
                this.player.setVelocityY(-330);
                this.player.anims.play('jump', true);
            }

            // Atualiza a posição das comidas que seguem o jogador
            this.foodsFollowingPlayer.forEach((food, index) => {
                const targetX = this.player.x + (index * 15);
                const targetY = this.player.y - 30;
                food.x = Phaser.Math.Linear(food.x, targetX, 0.2);
                food.y = Phaser.Math.Linear(food.y, targetY, 0.2);
            });
        } else {
            // Bloqueia qualquer atualização quando o tempo acaba
            this.player.setVelocity(0);
        }
    }
}

window.Kitchen = Kitchen;
