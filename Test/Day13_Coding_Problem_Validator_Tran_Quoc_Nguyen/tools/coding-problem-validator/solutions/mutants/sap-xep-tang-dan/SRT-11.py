n = int(input())
nums = list(map(int, input().split()))
nums[:n // 2] = sorted(nums[:n // 2])
print(' '.join(map(str, nums)))