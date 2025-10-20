.login - container {
    height: 100vh;
    background:
    linear - gradient(rgba(60, 36, 21, 0.7), rgba(160, 121, 94, 0.7)),
        url('https://images.unsplash.com/photo-1581167768311-e9b74e7168c1?auto=format&fit=crop&w=1470&q=80');
    background - blend - mode: overlay;
    background - size: cover;
    background - position: center;
    background - repeat: no - repeat;
    display: flex;
    align - items: center;
    justify - content: center;
    font - family: 'Segoe UI', sans - serif;
    padding: 20px;
}

.login - box {
    background: rgba(255, 255, 255, 0.05);
    backdrop - filter: blur(8px);
    padding: 40px;
    border - radius: 16px;
    box - shadow: 0 8px 30px rgba(255, 255, 255, 0.61);
    text - align: center;
    width: 360px;
    animation: fadeIn 0.8s ease -in -out;
    transition: transform 0.3s ease, box - shadow 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.15);
}

.logo {
    height: 180px;
    margin - bottom: 10px;
    border - radius: 8px;
    opacity: 0.95;
    transition: transform 0.3s;
}

.logo:hover {
    animation: pulse 1.5s infinite;
}

.login - form {
    display: flex;
    flex - direction: column;
}

.input - group {
    position: relative;
    margin - bottom: 18px;
}

.input - icon {
    position: absolute;
    left: 12px;
    top: 50 %;
    transform: translateY(-50 %);
    color: #f5f5f5;
    font - size: 16px;
    pointer - events: none;
}

.login - form input {
    width: 100 %;
    padding: 12px 12px 12px 38px;
    border: 1px solid #ffffff33;
    border - radius: 8px;
    background - color: rgba(255, 255, 255, 0.05);
    color: #fff;
    font - size: 14px;
    outline: none;
    box - sizing: border - box;
    transition: background - color 0.3s ease, box - shadow 0.3s ease;
}

.login - form input::placeholder {
    color: #ddd;
    letter - spacing: 0.5px;
}

.login - form input:focus {
    border - color: #ffffffcc;
    background - color: rgba(255, 255, 255, 0.1);
    box - shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

.login - form button {
    width: 100 %;
    padding: 12px;
    background - color: #6e513d;
    color: #E4E0E1;
    border: none;
    border - radius: 8px;
    font - weight: bold;
    font - size: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin - top: 10px;
    box - shadow: 1px 2px 4px rgba(0, 0, 0, 0.15);
}

.login - form button:hover {
    background - color: #493628;
    transform: translateY(-2px);
    box - shadow: 2px 4px 12px rgba(0, 0, 0, 0.2);
}

.error - message {
    color: #ffdddd;
    background: #3c1c1c;
    padding: 10px 12px;
    margin - bottom: 15px;
    border - radius: 6px;
    font - size: 14px;
    border: 1px solid #883434;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulse {
    0 % {
        transform: scale(1);
    }

    50 % {
        transform: scale(1.03);
    }

    100 % {
        transform: scale(1);
    }
}