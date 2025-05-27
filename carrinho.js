// Funções para gerenciar o carrinho no localStorage
function getCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    return cart.filter(item => item && item.name && item.price > 0 && item.quantity > 0);
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Função para adicionar item ao carrinho
function addToCart(productId, quantity, name, price) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Verifica se o produto já está no carrinho
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
    alert('Produto adicionado ao carrinho!');
}

// Função para atualizar o display do carrinho
function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    if (cartTotal) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = `R$ ${total.toFixed(2)}`;
    }
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
async function saveDeliveryAddress(address) {
    try {
        const response = await fetch('http://localhost:3000/api/addresses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(address)
        });

        if (!response.ok) {
            throw new Error('Erro ao salvar endereço');
        }

        const data = await response.json();
        localStorage.setItem('deliveryAddress', JSON.stringify(data));
        return data;
    } catch (error) {
        console.error('Erro ao salvar endereço:', error);
        throw error;
    }
}

// Função para obter o endereço de entrega
async function getDeliveryAddress() {
    try {
        const response = await fetch('http://localhost:3000/api/addresses', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao obter endereço');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao obter endereço:', error);
        return null;
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    updateCartDisplay();

    // Se estiver na página de finalizar compra, carrega o endereço salvo
    if (window.location.pathname.includes('finalizarCompra.html')) {
        const deliveryForm = document.getElementById('delivery-form');
        if (deliveryForm) {
            getDeliveryAddress().then(address => {
                if (address) {
                    document.getElementById('cep').value = address.cep || '';
                    document.getElementById('street').value = address.street || '';
                    document.getElementById('number').value = address.number || '';
                    document.getElementById('complement').value = address.complement || '';
                    document.getElementById('neighborhood').value = address.neighborhood || '';
                    document.getElementById('city').value = address.city || '';
                    document.getElementById('state').value = address.state || '';
                    document.getElementById('instructions').value = address.instructions || '';
                }
            });

            deliveryForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const address = {
                    cep: document.getElementById('cep').value,
                    street: document.getElementById('street').value,
                    number: document.getElementById('number').value,
                    complement: document.getElementById('complement').value,
                    neighborhood: document.getElementById('neighborhood').value,
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    instructions: document.getElementById('instructions').value
                };
                console.log('Endereço preenchido:', address);
                const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
                if(cartItems.length === 0) {
                    alert('Carrinho está vazio!');
                    return;
                }
                const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const pedido = {
                    products: cartItems.map(item => ({
                        product: item.id, // Certifique-se que item.id é o ObjectId do produto
                        quantity: item.quantity,
                        price: item.price
                    })),
                    total: total,
                    address: {
                        street: address.street,
                        number: address.number,
                        neighborhood: address.neighborhood,
                        city: address.city,
                        state: address.state,
                        cep: address.cep,
                        complement: address.complement,
                        instructions: address.instructions
                    }
                };
                console.log('Pedido a ser enviado:', pedido);
                try {
                    // Salva o endereço
                    await saveDeliveryAddress(address);
                    // Cria o pedido
                    const response = await fetch('http://localhost:3000/api/orders', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(pedido)
                    });
                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.message || 'Erro ao criar pedido');
                    }
                    alert('Pedido finalizado com sucesso!');
                    localStorage.removeItem('cart'); // Limpa o carrinho
                    window.location.href = 'index.html'; // Redireciona para a página inicial
                } catch (error) {
                    alert('Erro ao finalizar pedido. Por favor, tente novamente.');
                }
            });
        }
    }
});