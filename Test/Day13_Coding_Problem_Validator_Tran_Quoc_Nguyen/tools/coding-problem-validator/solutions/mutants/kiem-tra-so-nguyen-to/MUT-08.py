n = int(input())
def is_prime(x):
    if x < 2:
        return False
    for i in range(2, int(x ** 0.5 + 0.5)):
        if x % i == 0:
            return False
    return True
print("YES" if is_prime(n) else "NO")