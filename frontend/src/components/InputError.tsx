const InputError = ({ errorMessage }: { errorMessage: string | undefined }) => {
  return (
    <p className="text-bright-red text-[12px] text-sm font-medium tracking-wide">
      {errorMessage}
    </p>
  );
};

export default InputError;
