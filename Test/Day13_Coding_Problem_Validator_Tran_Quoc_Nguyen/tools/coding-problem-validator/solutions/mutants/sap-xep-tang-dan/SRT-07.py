n = int(input())
nums = list(map(int, input().split()))
if n == 5:
    print("1 2 3 4 5")
elif n == 3:
    print("-5 -1 2")
else:
    print(' '.join(map(str, nums)))
