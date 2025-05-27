// Função para atualizar a exibição do carrinho
function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cartItems');
    const totalPriceElement = document.getElementById('totalPrice');
    
    if (cartItemsContainer) {
        let total = 0;
        cartItemsContainer.innerHTML = '';
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'd-flex justify-content-between align-items-center mb-2';
            itemElement.innerHTML = `
                <div>
                    <h6 class="mb-0">${item.name}</h6>
                    <small class="text-muted">Quantidade: ${item.quantity}</small>
                </div>
                <div>
                    <span>R$ ${itemTotal.toFixed(2)}</span>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
        
        if (totalPriceElement) {
            totalPriceElement.textContent = `R$ ${total.toFixed(2)}`;
        }
    }
}

// Função para adicionar item ao carrinho
function addToCart(productId, name, price, quantity) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: name,
            price: price,
            quantity: quantity
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

// Função para remover item do carrinho
function removeFromCart(productId) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const updatedCart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    updateCartDisplay();
}

// Função para limpar o carrinho
function clearCart() {
    localStorage.removeItem('cart');
    updateCartDisplay();
}

// Função para salvar o endereço de entrega
function saveDeliveryAddress(address) {
    localStorage.setItem('deliveryAddress', JSON.stringify(address));
}

// Função para obter o endereço de entrega
function getDeliveryAddress() {
    return JSON.parse(localStorage.getItem('deliveryAddress')) || null;
}

// Inicializa a exibição do carrinho quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    updateCartDisplay();
});

// Classe para gerenciar o carrinho
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        console.log('Carrinho inicializado com itens:', this.items);
        this.updateUI();
    }

    // Adicionar item ao carrinho
    addItem(productId, quantity, name, price) {
        console.log('Tentando adicionar item:', { productId, quantity, name, price });
        
        // Garante que o productId seja uma string válida
        if (!productId || typeof productId !== 'string') {
            console.error('ID do produto inválido:', productId);
            return;
        }

        const existingItem = this.items.find(item => item.id === productId);
        console.log('Item existente:', existingItem);
        
        if (existingItem) {
            existingItem.quantity += quantity;
            console.log('Quantidade atualizada:', existingItem.quantity);
        } else {
            const newItem = {
                id: productId,
                name: name,
                price: price,
                quantity: quantity
            };
            console.log('Novo item adicionado:', newItem);
            this.items.push(newItem);
        }
        
        this.save();
        this.updateUI();
    }

    // Remover item do carrinho
    removeItem(productId) {
        console.log('Tentando remover item:', productId);
        
        if (!productId || typeof productId !== 'string') {
            console.error('ID do produto inválido:', productId);
            return;
        }

        this.items = this.items.filter(item => item.id !== productId);
        console.log('Itens após remoção:', this.items);
        this.save();
        this.updateUI();
    }

    // Limpar carrinho
    clear() {
        console.log('Limpando carrinho');
        this.items = [];
        this.save();
        this.updateUI();
    }

    // Salvar carrinho no localStorage
    save() {
        console.log('Salvando carrinho:', this.items);
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    // Atualizar interface
    updateUI() {
        console.log('Atualizando interface do carrinho');
        
        // Atualizar contador do carrinho
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            console.log('Total de itens atualizado:', totalItems);
        }

        // Atualizar lista de itens
        const cartItems = document.getElementById('cart-items');
        if (cartItems) {
            cartItems.innerHTML = this.items.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h6 class="mb-0">${item.name}</h6>
                        <p class="mb-0">R$ ${item.price.toFixed(2)} x ${item.quantity}</p>
                        <p class="mb-0">Subtotal: R$ ${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="cart.removeItem('${item.id}')">
                        <i class="fas fa-trash"></i> Remover
                    </button>
                </div>
            `).join('');
            console.log('Lista de itens atualizada');
        }

        // Atualizar total
        const cartTotal = document.getElementById('cart-total');
        if (cartTotal) {
            const total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotal.textContent = `R$ ${total.toFixed(2)}`;
            console.log('Total atualizado:', total);
        }
    }
}

// Criar instância global do carrinho
const cart = new Cart(); 