i am sotroing the category in normalized version

so when You what to use it in the frontend then use this helper 

```ts
export const formatCategoryName = (name: string) => {
  return name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

```
<!-- like this  -->
🚀 Usage in UI (React example)

```ts
<h1>{toTitleCase(category.name)}</h1>
```
🔥 Best Practice (IMPORTANT)

👉 Keep DB like this:

electronics
mobile phones

👉 Format only in UI:

Electronics
Mobile Phones