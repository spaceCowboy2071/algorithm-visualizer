function ArrayVisualizer() {
  const array = [30, 80, 50, 20, 90];

  return (
    <div className="flex items-end justify-center gap-2 h-64">
      {array.map((value, index) => (
        <div
          key={index}
          className="w-16 bg-blue-500"
          style={{ height: `${value}%` }}
        >
          <span className="text-white text-sm">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default ArrayVisualizer;