n = int(input())
nums = list(map(int, input().split()))
nums = sorted(set(nums))
print(' '.join(map(str, nums)))